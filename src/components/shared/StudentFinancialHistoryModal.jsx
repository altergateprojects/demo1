import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { formatINR, formatDate } from '../../lib/formatters'
import LoadingScreen from '../ui/LoadingScreen'
import { supabase } from '../../lib/supabase'
import { useAcademicYears } from '../../hooks/useCommon'

const StudentFinancialHistoryModal = ({ isOpen, onClose, student }) => {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, fees, pocket_money
  const [previousYearsDues, setPreviousYearsDues] = useState(0)
  const [previousYearsPending, setPreviousYearsPending] = useState(0)
  
  const { data: academicYears } = useAcademicYears()
  
  // Helper to get academic year from date
  const getAcademicYearFromDate = (date) => {
    if (!academicYears || !date) return null
    const txDate = new Date(date)
    return academicYears.find(year => {
      const start = new Date(year.start_date)
      const end = new Date(year.end_date)
      return txDate >= start && txDate <= end
    })
  }
  
  const currentYear = academicYears?.find(y => y.is_current)

  useEffect(() => {
    if (isOpen && student?.id) {
      fetchTransactions()
    }
  }, [isOpen, student?.id])

  const fetchTransactions = async () => {
    setIsLoading(true)
    console.log('=== Fetching Financial History for Student ===')
    console.log('Student ID:', student.id)
    console.log('Student Name:', student.full_name)
    console.log('Current Academic Year ID:', student.academic_year_id)
    
    try {
      const allTransactions = []
      let latestPromotionDate = null

      // Fetch previous years dues and latest promotion date from snapshots
      try {
        const { data: snapshots, error: snapshotError } = await supabase
          .from('student_year_snapshots')
          .select('dues_carried_forward_paise, fee_due_paise, academic_year_id, snapshot_date')
          .eq('student_id', student.id)
          .order('snapshot_date', { ascending: false })
        
        if (snapshotError) {
          console.error('Snapshot query error:', snapshotError)
        }
        
        if (!snapshotError && snapshots && snapshots.length > 0) {
          const totalPreviousDues = snapshots.reduce((sum, snap) => 
            sum + (snap.dues_carried_forward_paise || 0), 0
          )
          const totalPreviousPending = snapshots.reduce((sum, snap) => 
            sum + (snap.fee_due_paise || 0), 0
          )
          setPreviousYearsDues(totalPreviousDues)
          setPreviousYearsPending(totalPreviousPending)
          
          // Get the most recent promotion date (when student entered current year)
          latestPromotionDate = snapshots[0].snapshot_date
          
          console.log('✓ Snapshots loaded successfully')
          console.log('Previous years dues (carried forward):', totalPreviousDues)
          console.log('Previous years pending fees:', totalPreviousPending)
          console.log('Latest promotion date:', latestPromotionDate)
          console.log('Snapshots count:', snapshots.length)
        } else {
          console.log('ℹ No snapshots found - student has not been promoted yet')
        }
      } catch (err) {
        console.error('Snapshot fetch error:', err)
      }

      // Store promotion date for filtering
      window._latestPromotionDate = latestPromotionDate

      // 1. Fetch Fee Payments
      try {
        const { data: feePayments, error: feeError } = await supabase
          .from('fee_payments')
          .select('*')
          .eq('student_id', student.id)
          .order('payment_date', { ascending: true })

        console.log('Fee payments fetched:', feePayments?.length || 0, 'records')
        
        if (!feeError && feePayments && feePayments.length > 0) {
          feePayments.forEach(payment => {
            allTransactions.push({
              date: payment.payment_date,
              type: 'fee_payment',
              title: '💰 Fee Payment Received',
              amount: payment.amount_paise,
              isCredit: true,
              details: `Receipt: ${payment.receipt_number || 'N/A'} • ${payment.payment_method || 'Cash'}`,
              rawData: payment,
              createdAt: payment.created_at
            })
          })
        }
      } catch (err) {
        console.error('Fee payments error:', err)
      }

      // 2. Fetch Pocket Money Transactions
      try {
        const { data: pocketTransactions, error: pocketError } = await supabase
          .from('pocket_money_transactions')
          .select('*')
          .eq('student_id', student.id)
          .order('transaction_date', { ascending: true })

        console.log('Pocket money transactions:', pocketTransactions?.length || 0, 'records')
        
        if (!pocketError && pocketTransactions && pocketTransactions.length > 0) {
          pocketTransactions.forEach(txn => {
            if (txn.transaction_type === 'deposit' || txn.transaction_type === 'credit') {
              allTransactions.push({
                date: txn.transaction_date,
                type: 'pocket_deposit',
                title: '💵 Pocket Money Added',
                amount: txn.amount_paise,
                isCredit: true,
                details: txn.description || 'Money added to pocket',
                rawData: txn
              })
            } else {
              allTransactions.push({
                date: txn.transaction_date,
                type: 'pocket_withdrawal',
                title: '🛍️ Pocket Money Spent',
                amount: txn.amount_paise,
                isCredit: false,
                details: txn.description || 'Money withdrawn from pocket',
                rawData: txn
              })
            }
          })
        } else if (pocketError) {
          // Show current balance if no transaction history
          if (student.pocket_money_paise && student.pocket_money_paise !== 0) {
            allTransactions.push({
              date: student.created_at || new Date().toISOString(),
              type: 'pocket_balance',
              title: student.pocket_money_paise > 0 ? '💵 Pocket Money Balance' : '⚠️ Pocket Money Owed',
              amount: Math.abs(student.pocket_money_paise),
              isCredit: student.pocket_money_paise > 0,
              details: 'Current pocket money balance',
              rawData: student
            })
          }
        }
      } catch (err) {
        console.error('Pocket money error:', err)
        if (student.pocket_money_paise && student.pocket_money_paise !== 0) {
          allTransactions.push({
            date: student.created_at || new Date().toISOString(),
            type: 'pocket_balance',
            title: student.pocket_money_paise > 0 ? '💵 Pocket Money Balance' : '⚠️ Pocket Money Owed',
            amount: Math.abs(student.pocket_money_paise),
            isCredit: student.pocket_money_paise > 0,
            details: 'Current pocket money balance',
            rawData: student
          })
        }
      }

      // 3. Fetch Old Dues Payments
      try {
        const { data: duePayments, error: dueError } = await supabase
          .from('student_due_payments')
          .select(`
            *,
            student_dues!inner(
              student_id,
              due_type,
              academic_year_id,
              academic_years(year_label)
            )
          `)
          .eq('student_dues.student_id', student.id)
          .order('payment_date', { ascending: true })

        console.log('Due payments:', duePayments?.length || 0, 'records')
        
        if (!dueError && duePayments && duePayments.length > 0) {
          duePayments.forEach(payment => {
            const dueType = payment.student_dues?.due_type === 'fee' ? 'Fee' : 'Pocket Money'
            const year = payment.student_dues?.academic_years?.year_label || 'Previous Year'
            
            allTransactions.push({
              date: payment.payment_date,
              type: 'due_payment',
              title: `📋 Old ${dueType} Due Paid`,
              amount: payment.payment_amount_paise,
              isCredit: true,
              details: `Payment for ${year} • ${payment.payment_method || 'Cash'}`,
              rawData: payment
            })
          })
        }
      } catch (err) {
        console.error('Due payments error:', err)
      }

      // Sort by date (oldest first)
      allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date))

      console.log('Total transactions:', allTransactions.length)
      setTransactions(allTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') return true
    if (filter === 'fees') return txn.type.includes('fee') || txn.type === 'due_payment'
    if (filter === 'pocket_money') return txn.type.includes('pocket')
    return true
  })

  // Calculate summary stats - only current year fees
  // Only count payments made AFTER the student was promoted to current year
  const latestPromotionDate = window._latestPromotionDate
  
  const totalFeeCollected = transactions
    .filter(t => {
      if (t.type !== 'fee_payment') return false
      
      // If student has been promoted, only count payments after promotion
      if (latestPromotionDate && student.last_promoted_at) {
        const paymentDate = new Date(t.date)
        const promotionDate = new Date(student.last_promoted_at)
        const isAfterPromotion = paymentDate >= promotionDate
        
        console.log('Payment:', t.date, 'Promotion:', student.last_promoted_at, 'After promotion?', isAfterPromotion)
        
        return isAfterPromotion
      }
      
      // Alternative: If we have snapshot data, check against that
      if (latestPromotionDate) {
        const paymentDate = new Date(t.date)
        const snapshotDate = new Date(latestPromotionDate)
        const isAfterPromotion = paymentDate >= snapshotDate
        
        console.log('Payment:', t.date, 'Snapshot:', latestPromotionDate, 'After promotion?', isAfterPromotion)
        
        return isAfterPromotion
      }
      
      // If no promotion history, count all payments in current year
      const txYear = getAcademicYearFromDate(t.date)
      const isCurrentYear = txYear && currentYear && txYear.id === currentYear.id
      
      console.log('Payment:', t.date, 'No promotion history, current year?', isCurrentYear)
      
      return isCurrentYear
    })
    .reduce((sum, t) => sum + t.amount, 0)
  
  const feePending = Math.max(0, (student.annual_fee_paise || 0) - (student.fee_paid_paise || 0))
  const pocketMoneyBalance = student.pocket_money_paise || 0

  if (!student) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial History"
      size="xl"
    >
      <div className="space-y-4">
        {/* Student Header - Compact */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {student.full_name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Roll {student.roll_number} • {student.standards?.name}
            </p>
          </div>
        </div>

        {/* Summary Cards - Professional 4-column layout */}
        <div className="grid grid-cols-4 gap-3">
          {/* Fee Collected (Current Year Only) */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">
                Fee Collected
              </span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 ml-10">
              {formatINR(totalFeeCollected)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 ml-10 mt-1">
              Current Year
            </p>
          </div>

          {/* Fee Pending (Current Year) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <span className="text-lg">⏳</span>
              </div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Fee Pending
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 ml-10">
              {formatINR(feePending)}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 ml-10 mt-1">
              Current Year
            </p>
          </div>

          {/* Previous Years Pending */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <span className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">
                Previous Years
              </span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400 ml-10">
              {formatINR(previousYearsPending)}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 ml-10 mt-1">
              Pending Fees
            </p>
          </div>

          {/* Pocket Money */}
          <div className={`bg-gradient-to-br rounded-lg p-4 border ${
            pocketMoneyBalance >= 0
              ? 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
              : 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                pocketMoneyBalance >= 0
                  ? 'bg-blue-100 dark:bg-blue-900/40'
                  : 'bg-purple-100 dark:bg-purple-900/40'
              }`}>
                <span className="text-lg">{pocketMoneyBalance >= 0 ? '💰' : '⚠️'}</span>
              </div>
              <span className={`text-xs font-medium uppercase tracking-wide ${
                pocketMoneyBalance >= 0
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-purple-700 dark:text-purple-400'
              }`}>
                Pocket Money
              </span>
            </div>
            <p className={`text-2xl font-bold ml-10 ${
              pocketMoneyBalance >= 0
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-purple-700 dark:text-purple-400'
            }`}>
              {pocketMoneyBalance < 0 ? '-' : ''}{formatINR(Math.abs(pocketMoneyBalance))}
            </p>
            <p className={`text-xs ml-10 mt-1 ${
              pocketMoneyBalance >= 0
                ? 'text-blue-600 dark:text-blue-500'
                : 'text-purple-600 dark:text-purple-500'
            }`}>
              {pocketMoneyBalance < 0 ? 'Overdraft' : 'Balance'}
            </p>
          </div>
        </div>

        {/* Filter Tabs - Compact */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('fees')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'fees'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Fees
          </button>
          <button
            onClick={() => setFilter('pocket_money')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'pocket_money'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Pocket Money
          </button>
        </div>

        {/* Transactions List - Compact & Professional */}
        {isLoading ? (
          <div className="py-8">
            <LoadingScreen />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {filteredTransactions.map((txn, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    txn.isCredit
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <span className="text-lg">
                      {txn.type === 'fee_payment' ? '💰' : 
                       txn.type === 'pocket_deposit' ? '💵' : 
                       txn.type === 'pocket_withdrawal' ? '🛍️' :
                       txn.type === 'due_payment' ? '📋' : '💳'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {txn.title.replace(/💰|💵|🛍️|📋|⚠️/g, '').trim()}
                      </p>
                      {(() => {
                        const txYear = getAcademicYearFromDate(txn.date)
                        if (txYear) {
                          const isPrevious = currentYear && txYear.id !== currentYear.id
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isPrevious
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {txYear.year_label}
                              {isPrevious && ' (Previous)'}
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {formatDate(txn.date)} • {txn.details}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className={`text-lg font-bold ${
                    txn.isCredit
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {txn.isCredit ? '+' : '-'}{formatINR(txn.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
              No Transactions
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No financial records found
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
        >
          Print
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default StudentFinancialHistoryModal
