import React from 'react'
import Modal from '../ui/Modal'
import { formatINR, formatDate } from '../../lib/formatters'
import LoadingScreen from '../ui/LoadingScreen'

const DuePaymentHistoryModal = ({ isOpen, onClose, dueGroup, paymentHistory, isLoading }) => {
  if (!dueGroup) return null

  const totalDue = (dueGroup?.fee_due || 0) + (dueGroup?.pocket_money_due || 0)
  const totalPaid = (dueGroup?.fee_paid || 0) + (dueGroup?.pocket_money_paid || 0)
  const remainingAmount = totalDue - totalPaid

  const getPaymentMethodBadge = (method) => {
    const colors = {
      cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      online: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      cheque: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      card: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      upi: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    }
    return colors[method] || colors.other
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment History"
      size="xl"
    >
      <div className="space-y-5">
        {/* Student Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                  <span className="text-base font-semibold text-white">
                    {dueGroup.studentName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {dueGroup.studentName}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Roll: {dueGroup.rollNumber} • {dueGroup.academicYear}
                </p>
              </div>
            </div>
            {dueGroup.studentStatus && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {dueGroup.studentStatus}
              </span>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
              Total Due
            </p>
            <p className="mt-1 text-xl font-bold text-red-700 dark:text-red-300">
              {formatINR(totalDue)}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
              Total Paid
            </p>
            <p className="mt-1 text-xl font-bold text-green-700 dark:text-green-300">
              {formatINR(totalPaid)}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Remaining
            </p>
            <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatINR(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Payment History ({paymentHistory?.length || 0} payments)
          </h4>

          {isLoading ? (
            <div className="py-8">
              <LoadingScreen />
            </div>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {paymentHistory.map((payment, index) => (
                <div
                  key={payment.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">
                            #{paymentHistory.length - index}
                          </span>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {formatINR(payment.payment_amount_paise)}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(payment.payment_date)}
                            </p>
                            {payment.payment_type && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                payment.payment_type === 'fee_payment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                payment.payment_type === 'pocket_money' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {payment.payment_type === 'fee_payment' ? 'Fee Payment' :
                                 payment.payment_type === 'pocket_money' ? 'Pocket Money' :
                                 'Due Payment'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodBadge(payment.payment_method)}`}>
                          {payment.payment_method?.toUpperCase() || 'N/A'}
                        </span>
                        
                        {payment.payment_reference && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            Ref: {payment.payment_reference}
                          </span>
                        )}
                      </div>

                      {(payment.notes || payment.description) && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic">
                          "{payment.notes || payment.description}"
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Recorded by: {payment.received_by_user?.full_name || payment.created_by_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No payments recorded yet
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalDue > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span>Payment Progress</span>
              <span>{Math.round((totalPaid / totalDue) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalPaid / totalDue) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default DuePaymentHistoryModal
