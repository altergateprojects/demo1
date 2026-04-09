import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRecordFeePayment } from '../../hooks/useStudents'
import { formatINR } from '../../lib/formatters'
import { PAYMENT_METHODS } from '../../lib/constants'
import Modal from '../ui/Modal'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'

const FeePaymentModal = ({ 
  isOpen, 
  onClose, 
  student 
}) => {
  const [validationErrors, setValidationErrors] = useState({})
  const recordPaymentMutation = useRecordFeePayment()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: {
      student_id: student?.id || '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      amount_paise: 0
    }
  })

  const watchedMethod = watch('payment_method')
  const watchedAmount = watch('amount_paise')

  const pendingFee = student ? Math.max(0, student.annual_fee_paise - student.fee_paid_paise) : 0
  const previousYearsPending = student?.previous_years_pending_paise || 0
  const totalPendingFee = pendingFee + previousYearsPending

  const validateForm = (data) => {
    const errors = {}
    
    if (!data.student_id) errors.student_id = 'Student is required'
    if (!data.amount_paise || data.amount_paise < 100) errors.amount_paise = 'Amount must be at least ₹1'
    if (!data.payment_date) errors.payment_date = 'Payment date is required'
    if (!data.payment_method) errors.payment_method = 'Payment method is required'
    
    // Conditional validation based on payment method
    if (['cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs'].includes(data.payment_method)) {
      if (!data.reference_number?.trim()) errors.reference_number = 'Reference number is required'
    }
    
    if (['cheque', 'dd'].includes(data.payment_method)) {
      if (!data.bank_name?.trim()) errors.bank_name = 'Bank name is required'
    }
    
    return Object.keys(errors).length === 0 ? null : errors
  }

  const onSubmit = async (data) => {
    const errors = validateForm(data)
    if (errors) {
      console.log('Validation errors:', errors)
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})
    
    try {
      console.log('Submitting fee payment:', data)
      const result = await recordPaymentMutation.mutateAsync(data)
      console.log('Fee payment recorded successfully:', result)
      reset()
      onClose()
    } catch (error) {
      console.error('Error recording payment:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }
  }

  const handleClose = () => {
    reset()
    setValidationErrors({})
    onClose()
  }

  // Clear conditional field errors when payment method changes
  const handlePaymentMethodChange = (e) => {
    setValue('payment_method', e.target.value)
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.reference_number
      delete newErrors.bank_name
      return newErrors
    })
  }

  if (!student) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Fee Payment"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            {student.full_name} - {student.standards?.name} ({student.roll_number})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-600 dark:text-slate-400">Annual Fee:</span>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {formatINR(student.annual_fee_paise)}
              </div>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Paid (Current):</span>
              <div className="font-medium text-green-600 dark:text-green-400">
                {formatINR(student.fee_paid_paise)}
              </div>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Pending (Current):</span>
              <div className="font-medium text-red-600 dark:text-red-400">
                {formatINR(pendingFee)}
              </div>
            </div>
            {previousYearsPending > 0 && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Previous Years:</span>
                <div className="font-medium text-orange-600 dark:text-orange-400">
                  {formatINR(previousYearsPending)}
                </div>
              </div>
            )}
          </div>
          {totalPendingFee > pendingFee && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Pending:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatINR(totalPendingFee)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Payment will be applied to previous years debt first, then current year
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <CurrencyInput
            label="Payment Amount *"
            value={watchedAmount}
            onChange={(value) => setValue('amount_paise', value)}
            error={validationErrors.amount_paise}
            helperText={`Maximum: ${formatINR(totalPendingFee)}${previousYearsPending > 0 ? ` (includes ₹${formatINR(previousYearsPending)} from previous years)` : ''}`}
          />

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              className={`input-field ${validationErrors.payment_date ? 'border-red-300 dark:border-red-600' : ''}`}
              {...register('payment_date')}
            />
            {validationErrors.payment_date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.payment_date}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Method *
            </label>
            <select
              className={`input-field ${validationErrors.payment_method ? 'border-red-300 dark:border-red-600' : ''}`}
              {...register('payment_method')}
              onChange={handlePaymentMethodChange}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            {validationErrors.payment_method && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.payment_method}
              </p>
            )}
          </div>

          {/* Reference Number */}
          {['cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs'].includes(watchedMethod) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reference Number *
              </label>
              <input
                type="text"
                className={`input-field ${validationErrors.reference_number ? 'border-red-300 dark:border-red-600' : ''}`}
                placeholder="Enter reference/transaction number"
                {...register('reference_number')}
              />
              {validationErrors.reference_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.reference_number}
                </p>
              )}
            </div>
          )}

          {/* Bank Name */}
          {['cheque', 'dd'].includes(watchedMethod) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                className={`input-field ${validationErrors.bank_name ? 'border-red-300 dark:border-red-600' : ''}`}
                placeholder="Enter bank name"
                {...register('bank_name')}
              />
              {validationErrors.bank_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.bank_name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Receipt Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Receipt Scan (Optional)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="input-field"
          />
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload a scan of the physical receipt (JPG, PNG, or PDF)
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="input-field"
            placeholder="Any additional notes about this payment"
            {...register('notes')}
          />
        </div>

        {/* Amount Validation Warning */}
        {watchedAmount > totalPendingFee && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Amount Exceeds Total Pending
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Payment amount {formatINR(watchedAmount)} exceeds total pending of {formatINR(totalPendingFee)}.
                  {previousYearsPending > 0 && (
                    <span className="block mt-1">
                      (Current year: {formatINR(pendingFee)} + Previous years: {formatINR(previousYearsPending)})
                    </span>
                  )}
                  Excess amount will be added to pocket money.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Allocation Preview */}
        {watchedAmount > 0 && watchedAmount <= totalPendingFee && previousYearsPending > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Payment Allocation Preview
            </h3>
            <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              {watchedAmount <= previousYearsPending ? (
                <p>• {formatINR(watchedAmount)} will be applied to previous years debt</p>
              ) : (
                <>
                  <p>• {formatINR(previousYearsPending)} will be applied to previous years debt</p>
                  <p>• {formatINR(watchedAmount - previousYearsPending)} will be applied to current year fees</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Receipt Preview */}
        {watchedAmount > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              Receipt Preview
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Receipt number will be auto-generated: RCPT-2024-25-XXXXXX
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              After recording, you can download the receipt PDF and send it to the parent.
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={recordPaymentMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={recordPaymentMutation.isLoading}
            disabled={watchedAmount <= 0}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default FeePaymentModal