import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import CurrencyInput from '../ui/CurrencyInput'
import { formatINR } from '../../lib/formatters'

const PayDueModal = ({ isOpen, onClose, dueGroup, onSuccess }) => {
  const [formData, setFormData] = useState({
    payment_amount_paise: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    payment_reference: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Calculate totals
  const totalDue = (dueGroup?.fee_due || 0) + (dueGroup?.pocket_money_due || 0)
  const totalPaid = (dueGroup?.fee_paid || 0) + (dueGroup?.pocket_money_paid || 0)
  const remainingAmount = totalDue - totalPaid

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleQuickAmount = (percentage) => {
    const amount = Math.round(remainingAmount * percentage)
    setFormData(prev => ({ ...prev, payment_amount_paise: amount }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.payment_amount_paise <= 0) {
      setError('Payment amount must be greater than zero')
      return
    }

    // The payment amount is already in paise from CurrencyInput
    // remainingAmount is also in paise
    if (formData.payment_amount_paise > remainingAmount) {
      setError(`Payment amount cannot exceed remaining amount of ${formatINR(remainingAmount)}`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSuccess({
        dueGroup,
        paymentData: formData
      })

      // Reset form
      setFormData({
        payment_amount_paise: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        payment_reference: '',
        notes: ''
      })

      onClose()
    } catch (err) {
      setError(err.message || 'Failed to record payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!dueGroup) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pay Student Due"
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          {/* Student Info */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
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
          </div>

          {/* Due Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                Total Due
              </p>
              <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
                {formatINR(totalDue)}
              </p>
              <div className="mt-2 space-y-1 text-xs text-red-600 dark:text-red-400">
                {dueGroup.fee_due > 0 && <div>Fee: {formatINR(dueGroup.fee_due)}</div>}
                {dueGroup.pocket_money_due > 0 && <div>Pocket Money: {formatINR(dueGroup.pocket_money_due)}</div>}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Remaining
              </p>
              <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-300">
                {formatINR(remainingAmount)}
              </p>
              {totalPaid > 0 && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  Paid: {formatINR(totalPaid)}
                </p>
              )}
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              value={formData.payment_amount_paise}
              onChange={(value) => handleChange('payment_amount_paise', value)}
              placeholder="Enter payment amount"
            />
            
            {/* Quick Amount Buttons */}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(0.25)}
                className="px-3 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(0.50)}
                className="px-3 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(0.75)}
                className="px-3 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(1.0)}
                className="px-3 py-1 text-xs font-medium rounded-md bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 transition-colors"
              >
                Full Amount
              </button>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) => handleChange('payment_date', e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => handleChange('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="cash">Cash</option>
              <option value="online">Online Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Payment Reference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Reference (Optional)
            </label>
            <Input
              type="text"
              value={formData.payment_reference}
              onChange={(e) => handleChange('payment_reference', e.target.value)}
              placeholder="Transaction ID, Cheque Number, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="Any additional notes about this payment"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You can make partial payments. The due will automatically move to "Cleared" section when fully paid.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default PayDueModal
