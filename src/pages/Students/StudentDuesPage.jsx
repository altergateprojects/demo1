import { useState } from 'react'
import Card from '../../components/ui/Card'
import AddManualDueModal from '../../components/shared/AddManualDueModal'
import PayDueModal from '../../components/shared/PayDueModal'
import DuePaymentHistoryModal from '../../components/shared/DuePaymentHistoryModal'
import { useStudentDues, useCreateStudentDue, useDuesSummaryStats, useAddDuePayment, useStudentExitDues } from '../../hooks/useStudentDues'
import { getDuePaymentHistory, addExitDuePayment } from '../../api/studentDues.api'
import { supabase } from '../../lib/supabase'
import { formatINR, formatDate } from '../../lib/formatters'
import LoadingScreen from '../../components/ui/LoadingScreen'
import toast from 'react-hot-toast'

const StudentDuesPage = () => {
  const [activeTab, setActiveTab] = useState('pending-dues')
  const [isAddDueModalOpen, setIsAddDueModalOpen] = useState(false)
  const [isPayDueModalOpen, setIsPayDueModalOpen] = useState(false)
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false)
  const [selectedDueGroup, setSelectedDueGroup] = useState(null)
  const [allPaymentHistory, setAllPaymentHistory] = useState([])
  
  // Fetch data
  const { data: pendingDues, isLoading: pendingLoading } = useStudentDues({ isCleared: false })
  const { data: clearedDues, isLoading: clearedLoading } = useStudentDues({ isCleared: true })
  const { data: exitDues, isLoading: exitLoading } = useStudentExitDues()
  const { data: stats, isLoading: statsLoading } = useDuesSummaryStats()
  const createDueMutation = useCreateStudentDue()
  const addPaymentMutation = useAddDuePayment()

  const handleAddDue = async (dueData) => {
    await createDueMutation.mutateAsync(dueData)
  }

  const handlePayDue = (dueGroup) => {
    setSelectedDueGroup(dueGroup)
    setIsPayDueModalOpen(true)
  }

  const handleViewHistory = async (dueGroup) => {
    console.log('Opening history for due group:', dueGroup)
    setSelectedDueGroup(dueGroup)
    
    let allPayments = []
    
    if (dueGroup.is_exit_due && dueGroup.student_id) {
      // For exit dues, fetch the student's complete payment history
      try {
        // Get fee payment history
        const { data: feePayments, error: feeError } = await supabase
          .from('fee_payments')
          .select(`
            *,
            received_by_user:user_profiles!received_by(full_name)
          `)
          .eq('student_id', dueGroup.student_id)
          .order('payment_date', { ascending: false })

        if (!feeError && feePayments) {
          const formattedFeePayments = feePayments.map(payment => ({
            ...payment,
            payment_type: 'fee_payment',
            description: `Fee Payment - ${payment.notes || 'Regular payment'}`,
            payment_amount_paise: payment.amount_paise,
            payment_date: payment.payment_date,
            payment_method: payment.payment_method,
            reference_number: payment.reference_number,
            received_by_user: payment.received_by_user
          }))
          allPayments.push(...formattedFeePayments)
        }

        // Get pocket money transactions
        const { data: pocketTransactions, error: pocketError } = await supabase
          .from('pocket_money_transactions')
          .select(`
            *,
            created_by_user:user_profiles!created_by(full_name)
          `)
          .eq('student_id', dueGroup.student_id)
          .order('transaction_date', { ascending: false })

        if (!pocketError && pocketTransactions) {
          const formattedPocketTransactions = pocketTransactions.map(transaction => ({
            ...transaction,
            payment_type: 'pocket_money',
            description: `Pocket Money ${transaction.transaction_type} - ${transaction.description || 'Transaction'}`,
            payment_amount_paise: transaction.amount_paise,
            payment_date: transaction.transaction_date,
            payment_method: 'cash', // Default for pocket money
            reference_number: null,
            received_by_user: transaction.created_by_user
          }))
          allPayments.push(...formattedPocketTransactions)
        }

        // Get any existing due payments for this student
        const { data: duePayments, error: duePayError } = await supabase
          .from('student_due_payments')
          .select(`
            *,
            student_dues!inner(student_id),
            paid_by_user:user_profiles!paid_by(full_name)
          `)
          .eq('student_dues.student_id', dueGroup.student_id)
          .order('payment_date', { ascending: false })

        if (!duePayError && duePayments) {
          const formattedDuePayments = duePayments.map(payment => ({
            ...payment,
            payment_type: 'due_payment',
            description: `Due Payment - ${payment.notes || 'Due settlement'}`,
            payment_amount_paise: payment.payment_amount_paise,
            payment_date: payment.payment_date,
            payment_method: payment.payment_method,
            reference_number: payment.reference_number,
            received_by_user: payment.paid_by_user
          }))
          allPayments.push(...formattedDuePayments)
        }

      } catch (error) {
        console.error('Error fetching exit due history:', error)
        toast.error('Failed to load payment history')
      }
    } else {
      // For regular dues, fetch payment history for each due ID
      for (const dueId of dueGroup.dueIds) {
        if (dueId.startsWith('exit_')) continue // Skip exit due IDs
        
        console.log('Fetching payments for due ID:', dueId)
        const payments = await getDuePaymentHistory(dueId)
        console.log('Received payments:', payments)
        allPayments.push(...payments)
      }
    }
    
    console.log('All payments combined:', allPayments)
    
    // Sort by date (newest first)
    allPayments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
    
    setAllPaymentHistory(allPayments)
    setIsPaymentHistoryModalOpen(true)
  }

  const handlePaymentSubmit = async ({ dueGroup, paymentData }) => {
    if (dueGroup.is_exit_due) {
      // Handle exit due payment
      try {
        // Find the exit due ID from the dueIds (it will be like "exit_123")
        const exitDueId = dueGroup.dueIds.find(id => id.startsWith('exit_'))?.replace('exit_', '')
        
        if (!exitDueId) {
          throw new Error('Exit due ID not found')
        }

        const result = await addExitDuePayment(exitDueId, paymentData)
        
        toast.success(`Payment recorded! ₹${paymentData.payment_amount_paise / 100} applied to exit due.`)
        
        // Refresh the data
        window.location.reload()
        
      } catch (error) {
        console.error('Error processing exit due payment:', error)
        toast.error('Failed to process exit due payment: ' + error.message)
      }
      return
    }

    // Handle regular due payment (existing logic)
    const totalDue = (dueGroup.fee_due || 0) + (dueGroup.pocket_money_due || 0)
    const totalPaid = (dueGroup.fee_paid || 0) + (dueGroup.pocket_money_paid || 0)
    
    let remainingPayment = paymentData.payment_amount_paise
    
    // Pay dues in order: fee first, then pocket money
    for (const dueId of dueGroup.dueIds) {
      if (remainingPayment <= 0) break
      
      // Find the corresponding due from pendingDues
      const due = pendingDues.find(d => d.id === dueId)
      if (!due) continue
      
      const dueRemaining = due.amount_paise - (due.amount_paid_paise || 0)
      const amountToPay = Math.min(remainingPayment, dueRemaining)
      
      if (amountToPay > 0) {
        await addPaymentMutation.mutateAsync({
          studentDueId: dueId,
          paymentData: {
            ...paymentData,
            payment_amount_paise: amountToPay
          }
        })
        
        remainingPayment -= amountToPay
      }
    }
  }

  const tabs = [
    { id: 'pending-dues', label: 'Pending Dues', count: (pendingDues?.length || 0) + (exitDues?.length || 0), icon: '⏳' },
    { id: 'cleared-dues', label: 'Cleared Dues', count: clearedDues?.length || 0, icon: '✅' },
    { id: 'statistics', label: 'Statistics', icon: '📊' }
  ]

  if (pendingLoading || clearedLoading || exitLoading || statsLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">📋</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Student Dues Management
                  </h1>
                  <p className="mt-1 text-sm text-purple-100">
                    Manage previous year dues, promotions, and exit dues
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsAddDueModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2 bg-white text-purple-600 hover:bg-purple-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
              >
                + Add Manual Due
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-purple-100 text-xs sm:text-sm font-medium">Total Pending</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{formatINR(stats.total_pending_dues || 0)}</div>
                <div className="mt-1 text-xs text-purple-100">{pendingDues?.length || 0} dues</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-purple-100 text-xs sm:text-sm font-medium">Total Cleared</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{formatINR(stats.total_cleared_dues || 0)}</div>
                <div className="mt-1 text-xs text-purple-100">{clearedDues?.length || 0} dues</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-purple-100 text-xs sm:text-sm font-medium">Fee Dues</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{formatINR(stats.pending_fee_dues || 0)}</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-purple-100 text-xs sm:text-sm font-medium">Pocket Money Dues</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{formatINR(stats.pending_pocket_money_dues || 0)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Pill-style Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'pending-dues' && (
        <>
          {((pendingDues && pendingDues.length > 0) || (exitDues && exitDues.length > 0)) ? (
            <div className="space-y-3">
              {(() => {
                // Combine regular dues and exit dues
                const allPendingDues = []
                
                // Add regular student dues
                if (pendingDues && pendingDues.length > 0) {
                  allPendingDues.push(...pendingDues)
                }
                
                // Add exit dues (convert format to match regular dues)
                if (exitDues && exitDues.length > 0) {
                  const convertedExitDues = exitDues.map(exitDue => ({
                    id: `exit_${exitDue.id}`,
                    student_id: exitDue.student_id,
                    student: null, // Exit dues don't have student relation
                    description: `[${exitDue.exit_reason}] ${exitDue.student_name} (Roll: ${exitDue.student_roll})`,
                    academic_year_id: null,
                    academic_year: null,
                    due_type: 'fee', // Treat as fee for grouping
                    amount_paise: exitDue.pending_fee_paise || 0,
                    amount_paid_paise: 0,
                    due_date: exitDue.exit_date,
                    is_exit_due: true,
                    exit_reason: exitDue.exit_reason,
                    exit_notes: exitDue.notes
                  }))
                  
                  // Add pocket money dues as separate entries if negative
                  exitDues.forEach(exitDue => {
                    if (exitDue.pending_pocket_money_paise < 0) {
                      allPendingDues.push({
                        id: `exit_pocket_${exitDue.id}`,
                        student_id: exitDue.student_id,
                        student: null,
                        description: `[${exitDue.exit_reason}] ${exitDue.student_name} (Roll: ${exitDue.student_roll})`,
                        academic_year_id: null,
                        academic_year: null,
                        due_type: 'pocket_money',
                        amount_paise: Math.abs(exitDue.pending_pocket_money_paise),
                        amount_paid_paise: 0,
                        due_date: exitDue.exit_date,
                        is_exit_due: true,
                        exit_reason: exitDue.exit_reason,
                        exit_notes: exitDue.notes
                      })
                    }
                  })
                  
                  allPendingDues.push(...convertedExitDues)
                }

                // Group dues by student and academic year
                const grouped = {}
                allPendingDues.forEach(due => {
                  const key = `${due.student_id || due.description}-${due.academic_year_id || 'exit'}`
                  if (!grouped[key]) {
                    grouped[key] = {
                      student: due.student,
                      description: due.description,
                      academic_year: due.academic_year,
                      academic_year_id: due.academic_year_id,
                      fee_due: 0,
                      pocket_money_due: 0,
                      fee_paid: 0,
                      pocket_money_paid: 0,
                      due_date: due.due_date,
                      student_id: due.student_id,
                      dueIds: [],
                      is_exit_due: due.is_exit_due || false,
                      exit_reason: due.exit_reason,
                      exit_notes: due.exit_notes
                    }
                  }
                  grouped[key].dueIds.push(due.id)
                  
                  if (due.due_type === 'fee') {
                    grouped[key].fee_due += due.amount_paise
                    grouped[key].fee_paid += (due.amount_paid_paise || 0)
                  } else {
                    grouped[key].pocket_money_due += due.amount_paise
                    grouped[key].pocket_money_paid += (due.amount_paid_paise || 0)
                  }
                })

                return Object.values(grouped).map((group, index) => {
                  let studentName = group.student?.full_name || 'Unknown Student'
                  let rollNumber = group.student?.roll_number || '-'
                  let studentStatus = null

                  if (!group.student && group.description) {
                    const match = group.description.match(/\[(.*?)\]\s*(.*?)\s*\(Roll:\s*(.*?)\)/)
                    if (match) {
                      studentStatus = match[1]
                      studentName = match[2]
                      rollNumber = match[3]
                    }
                  }

                  const totalDue = group.fee_due + group.pocket_money_due
                  const totalPaid = group.fee_paid + group.pocket_money_paid
                  const remainingAmount = totalDue - totalPaid

                  const dueGroupData = {
                    ...group,
                    studentName,
                    rollNumber,
                    studentStatus,
                    academicYear: group.academic_year?.year_label || (group.is_exit_due ? 'Exit Due' : 'N/A'),
                    dueIds: group.dueIds
                  }

                  return (
                    <Card 
                      key={index}
                      className={`group p-4 border hover:shadow-lg transition-all duration-200 ${
                        group.is_exit_due 
                          ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Student Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            group.is_exit_due 
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                              : 'bg-gradient-to-br from-purple-500 to-purple-700'
                          }`}>
                            <span className="text-base font-bold text-white">
                              {studentName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {studentName}
                              </h3>
                              {group.is_exit_due && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                  Exit
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Roll: {rollNumber}</span>
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                                {group.academic_year?.year_label || (group.is_exit_due ? 'Exit' : 'N/A')}
                              </span>
                              {group.is_exit_due && group.exit_reason && (
                                <span className="text-amber-600 dark:text-amber-400 truncate">
                                  {group.exit_reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Financial Info */}
                        <div className="flex items-center gap-4">
                          {/* Fee Due */}
                          <div className="text-center">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Fee Due</div>
                            {group.fee_due > 0 ? (
                              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                {formatINR(group.fee_due - group.fee_paid)}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400">—</div>
                            )}
                          </div>

                          {/* Pocket Money */}
                          <div className="text-center">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Pocket</div>
                            {group.pocket_money_due > 0 ? (
                              <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                {formatINR(group.pocket_money_due - group.pocket_money_paid)}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400">—</div>
                            )}
                          </div>

                          {/* Total */}
                          <div className="text-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Total</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {formatINR(remainingAmount)}
                            </div>
                          </div>

                          {/* Due Date */}
                          <div className="text-center">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Due Date</div>
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {formatDate(group.due_date)}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handlePayDue(dueGroupData)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            💰 Pay
                          </button>
                          <button
                            onClick={() => handleViewHistory(dueGroupData)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            📋 History
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })
              })()}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No Pending Dues
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  All dues have been cleared or no dues have been recorded yet.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'cleared-dues' && (
        <>
          {clearedDues && clearedDues.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                // Group cleared dues by student and academic year
                const grouped = {}
                clearedDues.forEach(due => {
                  const key = `${due.student_id || due.description}-${due.academic_year_id}`
                  if (!grouped[key]) {
                    grouped[key] = {
                      student: due.student,
                      description: due.description,
                      academic_year: due.academic_year,
                      academic_year_id: due.academic_year_id,
                      fee_cleared: 0,
                      pocket_money_cleared: 0,
                      cleared_date: due.cleared_date,
                      cleared_by_user: due.cleared_by_user,
                      student_id: due.student_id
                    }
                  }
                  if (due.due_type === 'fee') {
                    grouped[key].fee_cleared += due.amount_paise
                  } else {
                    grouped[key].pocket_money_cleared += due.amount_paise
                  }
                  if (new Date(due.cleared_date) > new Date(grouped[key].cleared_date)) {
                    grouped[key].cleared_date = due.cleared_date
                    grouped[key].cleared_by_user = due.cleared_by_user
                  }
                })

                return Object.values(grouped).map((group, index) => {
                  let studentName = group.student?.full_name || 'Unknown Student'
                  let rollNumber = group.student?.roll_number || '-'
                  let studentStatus = null

                  if (!group.student && group.description) {
                    const match = group.description.match(/\[(.*?)\]\s*(.*?)\s*\(Roll:\s*(.*?)\)/)
                    if (match) {
                      studentStatus = match[1]
                      studentName = match[2]
                      rollNumber = match[3]
                    }
                  }

                  const totalCleared = group.fee_cleared + group.pocket_money_cleared

                  return (
                    <Card 
                      key={index}
                      className="p-5 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Student Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                              <span className="text-lg font-bold text-white">
                                {studentName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                {studentName}
                              </h3>
                              {studentStatus && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  {studentStatus}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                ✅ Cleared
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <span>Roll: {rollNumber}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {group.academic_year?.year_label || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cleared Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
                          {/* Fee Cleared */}
                          <div className="text-center sm:text-left">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Fee Cleared</div>
                            {group.fee_cleared > 0 ? (
                              <div className="text-base font-bold text-green-600 dark:text-green-400">
                                {formatINR(group.fee_cleared)}
                              </div>
                            ) : (
                              <div className="text-base text-slate-400 dark:text-slate-600">—</div>
                            )}
                          </div>

                          {/* Pocket Money Cleared */}
                          <div className="text-center sm:text-left">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Pocket Money</div>
                            {group.pocket_money_cleared > 0 ? (
                              <div className="text-base font-bold text-green-600 dark:text-green-400">
                                {formatINR(group.pocket_money_cleared)}
                              </div>
                            ) : (
                              <div className="text-base text-slate-400 dark:text-slate-600">—</div>
                            )}
                          </div>

                          {/* Total Cleared */}
                          <div className="text-center sm:text-left">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Cleared</div>
                            <div className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 dark:bg-green-900/20">
                              <span className="text-base font-bold text-green-700 dark:text-green-400">
                                {formatINR(totalCleared)}
                              </span>
                            </div>
                          </div>

                          {/* Cleared Date & By */}
                          <div className="text-center sm:text-left">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Cleared On</div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {formatDate(group.cleared_date)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              By: {group.cleared_by_user?.full_name || '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })
              })()}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No Cleared Dues
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  No dues have been cleared yet.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Pending Dues</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(stats?.total_pending_dues || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Paid Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(stats?.total_paid_amount || 0)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Includes partial payments
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Students with Dues</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.total_students_with_dues || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Fee Dues</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(stats?.pending_fee_dues || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎒</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Pocket Money Dues</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(stats?.pending_pocket_money_dues || 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Manual Due Modal */}
      <AddManualDueModal
        isOpen={isAddDueModalOpen}
        onClose={() => setIsAddDueModalOpen(false)}
        onSuccess={handleAddDue}
      />

      {/* Pay Due Modal */}
      <PayDueModal
        isOpen={isPayDueModalOpen}
        onClose={() => {
          setIsPayDueModalOpen(false)
          setSelectedDueGroup(null)
        }}
        dueGroup={selectedDueGroup}
        onSuccess={handlePaymentSubmit}
      />

      {/* Payment History Modal */}
      <DuePaymentHistoryModal
        isOpen={isPaymentHistoryModalOpen}
        onClose={() => {
          setIsPaymentHistoryModalOpen(false)
          setSelectedDueGroup(null)
          setAllPaymentHistory([])
        }}
        dueGroup={selectedDueGroup}
        paymentHistory={allPaymentHistory}
        isLoading={false}
      />
    </div>
  )
}

export default StudentDuesPage