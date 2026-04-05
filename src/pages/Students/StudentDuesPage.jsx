import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AddManualDueModal from '../../components/shared/AddManualDueModal'
import PayDueModal from '../../components/shared/PayDueModal'
import DuePaymentHistoryModal from '../../components/shared/DuePaymentHistoryModal'
import { useStudentDues, useCreateStudentDue, useDuesSummaryStats, useAddDuePayment } from '../../hooks/useStudentDues'
import { getDuePaymentHistory } from '../../api/studentDues.api'
import { formatINR, formatDate } from '../../lib/formatters'
import LoadingScreen from '../../components/ui/LoadingScreen'

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
    
    // Fetch payment history for all dues in the group
    const allPayments = []
    for (const dueId of dueGroup.dueIds) {
      console.log('Fetching payments for due ID:', dueId)
      const payments = await getDuePaymentHistory(dueId)
      console.log('Received payments:', payments)
      allPayments.push(...payments)
    }
    
    console.log('All payments combined:', allPayments)
    
    // Sort by date (newest first)
    allPayments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
    
    setAllPaymentHistory(allPayments)
    setIsPaymentHistoryModalOpen(true)
  }

  const handlePaymentSubmit = async ({ dueGroup, paymentData }) => {
    // Calculate how to split payment across dues
    const totalDue = (dueGroup.fee_due || 0) + (dueGroup.pocket_money_due || 0)
    const totalPaid = (dueGroup.fee_paid || 0) + (dueGroup.pocket_money_paid || 0)
    const totalRemaining = totalDue - totalPaid
    
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
    { id: 'pending-dues', label: 'Pending Dues', count: pendingDues?.length || 0, icon: '⏳' },
    { id: 'cleared-dues', label: 'Cleared Dues', count: clearedDues?.length || 0, icon: '✅' },
    { id: 'statistics', label: 'Statistics', icon: '📊' }
  ]

  if (pendingLoading || clearedLoading || statsLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Student Dues Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage previous year dues, promotions, and exit dues
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="primary"
            onClick={() => setIsAddDueModalOpen(true)}
          >
            + Add Manual Due
          </Button>
          <Button variant="secondary" disabled>
            Clear Selected (0)
          </Button>
        </div>
      </div>

      {/* Tabs Preview */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      {activeTab === 'pending-dues' && (
        <Card>
          <Card.Header>
            <Card.Title>Pending Dues</Card.Title>
          </Card.Header>
          {pendingDues && pendingDues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Fee Due
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Pocket Money Due
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {(() => {
                    // Group dues by student and academic year
                    const grouped = {}
                    pendingDues.forEach(due => {
                      const key = `${due.student_id || due.description}-${due.academic_year_id}`
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
                          dueIds: []
                        }
                      }
                      // Track due IDs
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
                      // Extract student name from description if no student object
                      let studentName = group.student?.full_name || 'Unknown Student'
                      let rollNumber = group.student?.roll_number || '-'
                      let studentStatus = null

                      if (!group.student && group.description) {
                        // Parse description for student info
                        const match = group.description.match(/\[(.*?)\]\s*(.*?)\s*\(Roll:\s*(.*?)\)/)
                        if (match) {
                          studentStatus = match[1] // "Passed Out" or "Left School"
                          studentName = match[2]
                          rollNumber = match[3]
                        }
                      }

                      const totalDue = group.fee_due + group.pocket_money_due
                      const totalPaid = group.fee_paid + group.pocket_money_paid
                      const remainingAmount = totalDue - totalPaid

                      // Prepare group data for modals
                      const dueGroupData = {
                        ...group,
                        studentName,
                        rollNumber,
                        studentStatus,
                        academicYear: group.academic_year?.year_label || 'N/A',
                        dueIds: group.dueIds
                      }

                      return (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                                  <span className="text-sm font-semibold text-white">
                                    {studentName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {studentName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                  <span>Roll: {rollNumber}</span>
                                  {studentStatus && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                      {studentStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {group.academic_year?.year_label || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {group.fee_due > 0 ? (
                              <div>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {formatINR(group.fee_due)}
                                </span>
                                {group.fee_paid > 0 && (
                                  <div className="text-xs text-green-600 dark:text-green-400">
                                    Paid: {formatINR(group.fee_paid)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {group.pocket_money_due > 0 ? (
                              <div>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  {formatINR(group.pocket_money_due)}
                                </span>
                                {group.pocket_money_paid > 0 && (
                                  <div className="text-xs text-green-600 dark:text-green-400">
                                    Paid: {formatINR(group.pocket_money_paid)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="space-y-1">
                              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {formatINR(remainingAmount)}
                                </span>
                              </div>
                              {totalPaid > 0 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  of {formatINR(totalDue)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(group.due_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handlePayDue(dueGroupData)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                                title="Pay Due"
                              >
                                💰 Pay
                              </button>
                              <button
                                onClick={() => handleViewHistory(dueGroupData)}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                                title="View Payment History"
                              >
                                📋 History
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No Pending Dues
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                All dues have been cleared or no dues have been recorded yet.
              </p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'cleared-dues' && (
        <Card>
          <Card.Header>
            <Card.Title>Cleared Dues</Card.Title>
          </Card.Header>
          {clearedDues && clearedDues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Fee Cleared
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Pocket Money Cleared
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Cleared
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Cleared Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Cleared By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
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
                      // Use the latest cleared date
                      if (new Date(due.cleared_date) > new Date(grouped[key].cleared_date)) {
                        grouped[key].cleared_date = due.cleared_date
                        grouped[key].cleared_by_user = due.cleared_by_user
                      }
                    })

                    return Object.values(grouped).map((group, index) => {
                      // Extract student name from description if no student object
                      let studentName = group.student?.full_name || 'Unknown Student'
                      let rollNumber = group.student?.roll_number || '-'
                      let studentStatus = null

                      if (!group.student && group.description) {
                        // Parse description for student info
                        const match = group.description.match(/\[(.*?)\]\s*(.*?)\s*\(Roll:\s*(.*?)\)/)
                        if (match) {
                          studentStatus = match[1]
                          studentName = match[2]
                          rollNumber = match[3]
                        }
                      }

                      const totalCleared = group.fee_cleared + group.pocket_money_cleared

                      return (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
                                  <span className="text-sm font-semibold text-white">
                                    {studentName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {studentName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                  <span>Roll: {rollNumber}</span>
                                  {studentStatus && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                      {studentStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {group.academic_year?.year_label || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {group.fee_cleared > 0 ? (
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatINR(group.fee_cleared)}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {group.pocket_money_cleared > 0 ? (
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatINR(group.pocket_money_cleared)}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 dark:bg-green-900/20">
                              <span className="font-bold text-green-700 dark:text-green-400">
                                {formatINR(totalCleared)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(group.cleared_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                            {group.cleared_by_user?.full_name || '—'}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No Cleared Dues
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                No dues have been cleared yet.
              </p>
            </div>
          )}
        </Card>
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