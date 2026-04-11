import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { correctFeePayment, getFeePaymentById, canReversePayment } from '../../api/feeCorrection.api'
import { formatINR, formatDate } from '../../lib/formatters'
import { PAYMENT_METHODS } from '../../lib/constants'
import useAuthStore from '../../store/authStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import CurrencyInput from '../ui/CurrencyInput'
import toast from 'react-hot-toast'

const CorrectFeePaymentModal = ({ isOpen, onClose, paymentId }) => {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [originalPayment, setOriginalPayment] = useState(null)
  const [canCorrect, setCanCorrect] = useState({ can_reverse: false, reason: '' })
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    new_amount_paise: 0,
    new_payment_date: '',
    new_payment_method: 'cash',
    new_reference_number: '',
    new_bank_name: '',
    correction_reason: ''
  })

  const [errors, setErrors] = useState({})

  // Fetch original payment details
  useEffect(() => {
    if (isOpen && paymentId) {
      loadPaymentData()
    }
  }, [isOpen, paymentId])

  const loadPaymentData = async () => {
    try {
      setLoading(true)
      
      // Check if payment can be reversed
      const canReverseResult = await canReversePayment(paymentId)
      setCanCorrect(canReverseResult)
      
      if (!canReverseResult.can_reverse) {
        return
      }

      // Get payment details
      const payment = await getFeePaymentById(paymentId)
      setOriginalPayment(payment)
      
      // Pre-fill form with original values
      setFormData({
        new_amount_paise: payment.amount_paise,
        new_payment_date: payment.payment_date,
        new_payment_method: payment.payment_method || 'cash',
        new_reference_number: payment.reference_number || '',
        new_bank_name: payment.bank_name || '',
        correction_reason: ''
      })
    } catch (error) {
      console.error('Error loading payment:', error)
      toast.error('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  const correctMutation = useMutation({
    mutationFn: async (data) => {
      return await correctFeePayment(paymentId, {
        ...data,
        new_student_id: originalPayment.student_id, // Keep same student for now
        corrected_by: profile.id
      })
    },
    onSuccess: () => {
      toast.success('Payment corrected successfully')
      queryClient.invalidateQueries(['students'])
      queryClient.invalidateQueries(['fee-history'])
      queryClient.invalidateQueries(['dashboard'])
      handleClose()
    },
    onError: (error) => {
      console.error('Error correcting payment:', error)
      toast.error(error.message || 'Failed to correct payment')
    }
  })

  const validateForm = () => {
    const newErrors = {}
    
    // Allow zero or positive amounts (no minimum requirement)
    if (formData.new_amount_paise < 0) {
      newErrors.new_amount_paise = 'Amount cannot be negative'
    }
    
    if (!formData.new_payment_date) {
      newErrors.new_payment_date = 'Payment date is required'
    }
    
    if (!formData.correction_reason?.trim()) {
      newErrors.correction_reason = 'Reason for correction is required'
    }
    
    if (['cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs'].includes(formData.new_payment_method)) {
      if (!formData.new_reference_number?.trim()) {
        newErrors.new_reference_number = 'Reference number is required'
      }
    }
    
    if (['cheque', 'dd'].includes(formData.new_payment_method)) {
      if (!formData.new_bank_name?.trim()) {
        newErrors.new_bank_name = 'Bank name is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    correctMutation.mutate(formData)
  }

  const handleClose = () => {
    setFormData({
      new_amount_paise: 0,
      new_payment_date: '',
      new_payment_method: 'cash',
      new_reference_number: '',
      new_bank_name: '',
      correction_reason: ''
    })
    setErrors({})
    setOriginalPayment(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Correct Fee Payment"
      size="lg"
    >
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading payment details...</p>
        </div>
      ) : !canCorrect.can_reverse ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Cannot Correct This Payment
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {canCorrect.reason}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Original Payment Info */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Original Payment (Will be Reversed)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Student:</span>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {originalPayment?.student?.full_name}
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                <div className="font-medium text-red-600 dark:text-red-400">
                  {formatINR(originalPayment?.amount_paise)}
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Date:</span>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(originalPayment?.payment_date)}
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Method:</span>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {originalPayment?.payment_method?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              {originalPayment?.receipt_number && (
                <div className="col-span-2">
                  <span className="text-slate-600 dark:text-slate-400">Receipt:</span>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {originalPayment.receipt_number}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Corrected Payment Form */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Corrected Payment (New Entry)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Correct Amount * (in Rupees)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input-field ${errors.new_amount_paise ? 'border-red-300 dark:border-red-600' : ''}`}
                  value={formData.new_amount_paise / 100}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    if (inputValue === '' || inputValue === null) {
                      setFormData(prev => ({ ...prev, new_amount_paise: 0 }))
                      return
                    }
                    
                    // Use integer arithmetic to avoid floating-point errors
                    const parts = inputValue.split('.')
                    const rupees = parseInt(parts[0]) || 0
                    let paisePart = 0
                    if (parts[1]) {
                      const paiseStr = (parts[1] + '00').substring(0, 2)
                      paisePart = parseInt(paiseStr) || 0
                    }
                    const totalPaise = (rupees * 100) + paisePart
                    
                    setFormData(prev => ({ ...prev, new_amount_paise: totalPaise }))
                  }}
                  placeholder="0.00"
                />
                {errors.new_amount_paise && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.new_amount_paise}</p>
                )}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter amount in rupees (e.g., 100 for ₹100, 0 to reverse completely)
                </p>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Correct Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.new_payment_date ? 'border-red-300 dark:border-red-600' : ''}`}
                  value={formData.new_payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, new_payment_date: e.target.value }))}
                />
                {errors.new_payment_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.new_payment_date}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Correct Payment Method *
                </label>
                <select
                  className={`input-field ${errors.new_payment_method ? 'border-red-300 dark:border-red-600' : ''}`}
                  value={formData.new_payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, new_payment_method: e.target.value }))}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Number */}
              {['cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs'].includes(formData.new_payment_method) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reference Number *
                  </label>
                  <input
                    type="text"
                    className={`input-field ${errors.new_reference_number ? 'border-red-300 dark:border-red-600' : ''}`}
                    value={formData.new_reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_reference_number: e.target.value }))}
                    placeholder="Enter reference/transaction number"
                  />
                  {errors.new_reference_number && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.new_reference_number}</p>
                  )}
                </div>
              )}

              {/* Bank Name */}
              {['cheque', 'dd'].includes(formData.new_payment_method) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    className={`input-field ${errors.new_bank_name ? 'border-red-300 dark:border-red-600' : ''}`}
                    value={formData.new_bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_bank_name: e.target.value }))}
                    placeholder="Enter bank name"
                  />
                  {errors.new_bank_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.new_bank_name}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reason for Correction */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason for Correction *
            </label>
            <textarea
              rows={3}
              className={`input-field ${errors.correction_reason ? 'border-red-300 dark:border-red-600' : ''}`}
              value={formData.correction_reason}
              onChange={(e) => setFormData(prev => ({ ...prev, correction_reason: e.target.value }))}
              placeholder="Explain why this correction is needed (e.g., 'Wrong amount entered', 'Incorrect payment date')"
            />
            {errors.correction_reason && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.correction_reason}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This reason will be recorded in the audit trail
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create a reversal entry (negative amount) for the original payment</li>
                  <li>Create a new payment entry with the corrected details</li>
                  <li>Update the student's balance accordingly</li>
                  <li>Record this correction in the audit trail</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={correctMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={correctMutation.isLoading}
              className="bg-green-600 hover:bg-green-700"
              disabled={formData.new_amount_paise < 0}
            >
              Correct Payment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default CorrectFeePaymentModal
