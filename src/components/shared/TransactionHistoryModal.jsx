import React, { useState, useMemo } from 'react'
import { useStudentFeeHistory } from '../../hooks/useStudents'
import { usePocketMoneyHistory } from '../../hooks/usePocketMoney'
import { useAcademicYears } from '../../hooks/useCommon'
import { formatINR, formatDate } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import CorrectFeePaymentModal from './CorrectFeePaymentModal'
import useAuthStore from '../../store/authStore'

const TransactionHistoryModal = ({ 
  isOpen, 
  onClose, 
  student,
  type = 'fee' // 'fee' or 'pocket_money'
}) => {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [correctPaymentId, setCorrectPaymentId] = useState(null)
  
  const { data: feeHistory, isLoading: feeLoading } = useStudentFeeHistory(student?.id)
  const { data: pocketMoneyHistory, isLoading: pocketLoading } = usePocketMoneyHistory(student?.id)
  const { data: academicYears } = useAcademicYears()

  // Debug logging
  React.useEffect(() => {
    if (type === 'pocket_money' && student?.id) {
      console.log('Pocket Money History Modal:', {
        studentId: student.id,
        type,
        pocketMoneyHistory,
        isLoading: pocketLoading
      })
    }
  }, [type, student?.id, pocketMoneyHistory, pocketLoading])

  if (!student) return null

  // Helper function to determine which academic year a transaction belongs to
  const getTransactionYear = (transactionDate) => {
    if (!academicYears || !transactionDate) return null
    
    const txDate = new Date(transactionDate)
    const matchingYear = academicYears.find(year => {
      const startDate = new Date(year.start_date)
      const endDate = new Date(year.end_date)
      return txDate >= startDate && txDate <= endDate
    })
    
    return matchingYear
  }

  // Get current academic year
  const currentYear = useMemo(() => 
    academicYears?.find(y => y.is_current),
    [academicYears]
  )

  const transactions = type === 'fee' ? feeHistory : pocketMoneyHistory
  const isLoading = type === 'fee' ? feeLoading : pocketLoading
  
  const filteredTransactions = activeTab === 'all' 
    ? transactions 
    : transactions?.filter(t => t.transaction_type === activeTab || t.payment_method === activeTab)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${type === 'fee' ? 'Fee Payment' : 'Pocket Money'} History`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Student Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            {student.full_name} - {student.standards?.name} ({student.roll_number})
          </h3>
          {type === 'fee' ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Annual Fee:</span>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {formatINR(student.annual_fee_paise)}
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Paid:</span>
                <div className="font-medium text-green-600 dark:text-green-400">
                  {formatINR(student.fee_paid_paise)}
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Pending:</span>
                <div className="font-medium text-red-600 dark:text-red-400">
                  {formatINR(Math.max(0, student.annual_fee_paise - student.fee_paid_paise))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Current Balance:</span>
              <div className={`font-medium ${
                student.pocket_money_paise < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-slate-900 dark:text-slate-100'
              }`}>
                {formatINR(student.pocket_money_paise)}
                {student.pocket_money_paise < 0 && (
                  <span className="text-xs ml-1">(Overdraft)</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              All Transactions
            </button>
            {type === 'fee' ? (
              <>
                <button
                  onClick={() => setActiveTab('cash')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'cash'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  Cash
                </button>
                <button
                  onClick={() => setActiveTab('upi')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'upi'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  UPI
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('credit')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'credit'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  Credits
                </button>
                <button
                  onClick={() => setActiveTab('debit')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'debit'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  Debits
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Transaction List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading transactions...</p>
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`bg-white dark:bg-slate-800 border rounded-lg p-4 ${
                  transaction.is_reversal 
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {type === 'fee' 
                          ? formatDate(transaction.payment_date || transaction.created_at)
                          : formatDate(transaction.transaction_date || transaction.created_at)
                        }
                      </span>
                      
                      {/* Academic Year Badge */}
                      {(() => {
                        const txYear = getTransactionYear(
                          type === 'fee' 
                            ? (transaction.payment_date || transaction.created_at)
                            : (transaction.transaction_date || transaction.created_at)
                        )
                        const isPreviousYear = txYear && currentYear && txYear.id !== currentYear.id
                        
                        return txYear && (
                          <Badge variant={isPreviousYear ? 'warning' : 'default'}>
                            {txYear.year_label}
                            {isPreviousYear && ' (Previous)'}
                          </Badge>
                        )
                      })()}
                      
                      {type === 'fee' && transaction.is_reversal && (
                        <Badge variant="red">
                          REVERSED
                        </Badge>
                      )}
                      
                      {type === 'fee' && !transaction.is_reversal && (
                        <Badge variant="blue">
                          {transaction.payment_method?.replace('_', ' ') || 'Cash'}
                        </Badge>
                      )}
                      
                      {type === 'pocket_money' && (
                        <Badge variant={transaction.transaction_type === 'credit' ? 'green' : 'red'}>
                          {transaction.transaction_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {type === 'fee' 
                        ? transaction.is_reversal 
                          ? `REVERSAL: ${transaction.reversal_reason || transaction.notes || 'Payment reversed'}`
                          : transaction.notes || 'Fee payment'
                        : transaction.description
                      }
                    </p>
                    {type === 'fee' && transaction.receipt_number && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Receipt: {transaction.receipt_number}
                      </p>
                    )}
                    {type === 'pocket_money' && transaction.balance_after_paise !== undefined && transaction.balance_after_paise !== null && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Balance after: <span className={transaction.balance_after_paise < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                          {formatINR(transaction.balance_after_paise)}
                          {transaction.balance_after_paise < 0 && ' (Overdraft)'}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      type === 'pocket_money' && transaction.transaction_type === 'debit'
                        ? 'text-red-600 dark:text-red-400'
                        : transaction.is_reversal
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {type === 'pocket_money' && transaction.transaction_type === 'debit' ? '-' : transaction.is_reversal ? '-' : '+'}
                      {formatINR(transaction.amount_paise)}
                    </div>
                    {type === 'fee' && transaction.reference_number && (
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Ref: {transaction.reference_number}
                      </p>
                    )}
                    {type === 'fee' && !transaction.is_reversal && ['admin', 'finance'].includes(profile?.role) && (
                      <button
                        onClick={() => setCorrectPaymentId(transaction.id)}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Correct Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-400 dark:text-slate-500 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No {activeTab === 'all' ? '' : activeTab + ' '}transactions found
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Correct Payment Modal */}
      <CorrectFeePaymentModal
        isOpen={!!correctPaymentId}
        onClose={() => setCorrectPaymentId(null)}
        paymentId={correctPaymentId}
      />
    </Modal>
  )
}

export default TransactionHistoryModal