import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { createBorrowedCapital } from '../../api/borrowedCapital.api'
import { useCurrentAcademicYear } from '../../hooks/useCommon'
import useAuthStore from '../../store/authStore'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import CurrencyInput from '../ui/CurrencyInput'

const BorrowCapitalModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore()
  const { data: currentYear } = useCurrentAcademicYear()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    amount: '',
    borrowed_date: new Date().toISOString().split('T')[0],
    lender_name: '',
    lender_contact: '',
    expected_return_date: '',
    interest_rate_percentage: '0',
    repayment_terms: '',
    agreement_reference: '',
    purpose: '',
    notes: ''
  })

  const [errors, setErrors] = useState({})

  const createMutation = useMutation({
    mutationFn: createBorrowedCapital,
    onSuccess: () => {
      toast.success('Borrowed capital recorded successfully')
      queryClient.invalidateQueries(['borrowed-capital'])
      queryClient.invalidateQueries(['dashboard'])
      handleClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record borrowed capital')
    }
  })

  const handleClose = () => {
    setFormData({
      amount: '',
      borrowed_date: new Date().toISOString().split('T')[0],
      lender_name: '',
      lender_contact: '',
      expected_return_date: '',
      interest_rate_percentage: '0',
      repayment_terms: '',
      agreement_reference: '',
      purpose: '',
      notes: ''
    })
    setErrors({})
    onClose()
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0'
    }

    if (!formData.borrowed_date) {
      newErrors.borrowed_date = 'Borrowed date is required'
    }

    if (!formData.lender_name?.trim()) {
      newErrors.lender_name = 'Lender name is required'
    }

    if (!formData.purpose?.trim()) {
      newErrors.purpose = 'Purpose is required'
    }

    if (formData.interest_rate_percentage && parseFloat(formData.interest_rate_percentage) < 0) {
      newErrors.interest_rate_percentage = 'Interest rate cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    // Convert amount to paise
    const amount_paise = Math.round(parseFloat(formData.amount) * 100)

    // Create data hash for fraud-proof using Web Crypto API
    const dataToHash = JSON.stringify({
      amount_paise,
      borrowed_date: formData.borrowed_date,
      lender_name: formData.lender_name,
      purpose: formData.purpose,
      academic_year_id: currentYear.id,
      recorded_by: user.id,
      timestamp: new Date().toISOString()
    })
    
    const encoder = new TextEncoder()
    const data = encoder.encode(dataToHash)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const data_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const capitalData = {
      amount_paise,
      borrowed_date: formData.borrowed_date,
      lender_name: formData.lender_name.trim(),
      lender_contact: formData.lender_contact?.trim() || null,
      expected_return_date: formData.expected_return_date || null,
      interest_rate_percentage: formData.interest_rate_percentage ? parseFloat(formData.interest_rate_percentage) : 0,
      repayment_terms: formData.repayment_terms?.trim() || null,
      agreement_reference: formData.agreement_reference?.trim() || null,
      purpose: formData.purpose.trim(),
      notes: formData.notes?.trim() || null,
      data_hash,
      recorded_by: user.id,
      academic_year_id: currentYear.id,
      status: 'active',
      amount_repaid_paise: 0
    }

    createMutation.mutate(capitalData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="💳 Record Borrowed Capital"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Amount (₹) *
            </label>
            <CurrencyInput
              value={formData.amount}
              onChange={(value) => handleChange('amount', value)}
              placeholder="Enter amount"
              error={errors.amount}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Borrowed Date *
            </label>
            <Input
              type="date"
              value={formData.borrowed_date}
              onChange={(e) => handleChange('borrowed_date', e.target.value)}
              error={errors.borrowed_date}
            />
            {errors.borrowed_date && (
              <p className="mt-1 text-sm text-red-600">{errors.borrowed_date}</p>
            )}
          </div>
        </div>

        {/* Lender Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Lender Name *
            </label>
            <Input
              type="text"
              value={formData.lender_name}
              onChange={(e) => handleChange('lender_name', e.target.value)}
              placeholder="Enter lender name"
              error={errors.lender_name}
            />
            {errors.lender_name && (
              <p className="mt-1 text-sm text-red-600">{errors.lender_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Lender Contact
            </label>
            <Input
              type="text"
              value={formData.lender_contact}
              onChange={(e) => handleChange('lender_contact', e.target.value)}
              placeholder="Phone or email"
            />
          </div>
        </div>

        {/* Repayment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expected Return Date
            </label>
            <Input
              type="date"
              value={formData.expected_return_date}
              onChange={(e) => handleChange('expected_return_date', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Interest Rate (%)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.interest_rate_percentage}
              onChange={(e) => handleChange('interest_rate_percentage', e.target.value)}
              placeholder="0.00"
              error={errors.interest_rate_percentage}
            />
            {errors.interest_rate_percentage && (
              <p className="mt-1 text-sm text-red-600">{errors.interest_rate_percentage}</p>
            )}
          </div>
        </div>

        {/* Agreement Reference */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Agreement Reference
          </label>
          <Input
            type="text"
            value={formData.agreement_reference}
            onChange={(e) => handleChange('agreement_reference', e.target.value)}
            placeholder="Agreement number or reference"
          />
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Purpose *
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            placeholder="Why is this capital being borrowed?"
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 ${
              errors.purpose ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
          )}
        </div>

        {/* Repayment Terms */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Repayment Terms
          </label>
          <textarea
            value={formData.repayment_terms}
            onChange={(e) => handleChange('repayment_terms', e.target.value)}
            placeholder="Describe repayment schedule and terms"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional information"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Fraud-Proof Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 dark:text-blue-400">🔐</span>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">Fraud-Proof Recording</p>
              <p className="mt-1">This transaction will be cryptographically hashed and logged with complete audit trail for security and transparency.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Record Borrowed Capital
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default BorrowCapitalModal
