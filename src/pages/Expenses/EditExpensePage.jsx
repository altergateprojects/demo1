import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useExpense, useUpdateExpense } from '../../hooks/useExpenses'
import { EXPENSE_CATEGORIES } from '../../api/expenses.api'
import { formatINR } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import CurrencyInput from '../../components/ui/CurrencyInput'
import LoadingScreen from '../../components/ui/LoadingScreen'
import Badge from '../../components/ui/Badge'
import useAuthStore from '../../store/authStore'

const editExpenseSchema = z.object({
  expense_date: z.string().min(1, 'Expense date is required'),
  category: z.string().min(1, 'Category is required'),
  sub_category: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  vendor_name: z.string().min(1, 'Vendor name is required'),
  vendor_phone: z.string().optional(),
  amount_paise: z.number().min(100, 'Minimum amount is ₹1'),
  payment_method: z.enum(['cash', 'cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs']),
  reference_number: z.string().optional(),
  bill_number: z.string().min(1, 'Bill number is required for audit trail'),
  notes: z.string().optional(),
  change_reason: z.string().min(10, 'Detailed reason for changes is required for audit trail (minimum 10 characters)')
})

const EditExpensePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: expense, isLoading } = useExpense(id)
  const updateExpenseMutation = useUpdateExpense()
  const [showChanges, setShowChanges] = useState(false)
  const [originalData, setOriginalData] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(editExpenseSchema)
  })

  const watchedValues = watch()

  // Initialize form when expense data loads
  React.useEffect(() => {
    if (expense && !originalData) {
      const formData = {
        expense_date: expense.expense_date,
        category: expense.category,
        sub_category: expense.sub_category || '',
        description: expense.description,
        vendor_name: expense.vendor_name,
        vendor_phone: expense.vendor_phone || '',
        amount_paise: expense.amount_paise,
        payment_method: expense.payment_method,
        reference_number: expense.reference_number || '',
        bill_number: expense.bill_number,
        notes: expense.notes || '',
        change_reason: ''
      }
      
      reset(formData)
      setOriginalData(formData)
    }
  }, [expense, originalData, reset])

  // Detect changes
  const getChanges = () => {
    if (!originalData) return []
    
    const changes = []
    Object.keys(originalData).forEach(key => {
      if (key === 'change_reason') return // Skip change reason field
      
      const oldValue = originalData[key]
      const newValue = watchedValues[key]
      
      if (oldValue !== newValue) {
        changes.push({
          field: key,
          oldValue: oldValue || 'Empty',
          newValue: newValue || 'Empty',
          label: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        })
      }
    })
    
    return changes
  }

  const changes = getChanges()

  const onSubmit = async (data) => {
    if (changes.length === 0) {
      alert('No changes detected!')
      return
    }

    const confirmSubmit = window.confirm(
      `🔒 EXPENSE MODIFICATION AUDIT\n\n` +
      `⚠️ IMPORTANT NOTICE:\n` +
      `• ${changes.length} field(s) will be modified\n` +
      `• All changes will be permanently recorded in audit trail\n` +
      `• Original values will be preserved for transparency\n` +
      `• This action cannot be undone\n\n` +
      `Changes detected:\n${changes.map(c => `• ${c.label}: "${c.oldValue}" → "${c.newValue}"`).join('\n')}\n\n` +
      `Are you sure you want to proceed?`
    )
    
    if (!confirmSubmit) return

    try {
      // Get client IP for audit trail
      const clientIP = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown')

      const updateData = {
        ...data,
        // Audit trail information
        audit_changes: changes,
        audit_reason: data.change_reason,
        modified_by: user.id,
        modified_ip: clientIP,
        modified_user_agent: navigator.userAgent
      }

      await updateExpenseMutation.mutateAsync({ id, updates: updateData })
      
      alert('✅ Expense updated successfully with complete audit trail!')
      navigate(`/expenses/${id}`)
    } catch (error) {
      console.error('Error updating expense:', error)
      alert(`Failed to update expense: ${error.message || 'Unknown error'}`)
    }
  }

  if (isLoading) return <LoadingScreen />
  if (!expense) return <div>Expense not found</div>

  if (expense.is_locked) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Expense is Locked
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This expense has been locked and cannot be modified for security reasons.
          </p>
          <div className="space-x-3">
            <Button onClick={() => navigate(`/expenses/${id}`)} variant="secondary">
              View Details
            </Button>
            <Button onClick={() => navigate('/expenses')}>
              Back to Expenses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Edit Expense
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Modify expense details with complete audit trail
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => navigate(`/expenses/${id}`)} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>

      {/* Fraud Warning */}
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              🔒 Audit Trail Notice
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              All changes will be permanently recorded in the audit trail. Original values will be preserved for transparency and compliance.
            </p>
          </div>
        </div>
      </Card>

      {/* Changes Detection */}
      {changes.length > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              📝 Changes Detected ({changes.length})
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowChanges(!showChanges)}
            >
              {showChanges ? 'Hide' : 'Show'} Changes
            </Button>
          </div>
          
          {showChanges && (
            <div className="space-y-2">
              {changes.map((change, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{change.label}:</span>{' '}
                  <span className="text-red-600 dark:text-red-400">"{change.oldValue}"</span> →{' '}
                  <span className="text-green-600 dark:text-green-400">"{change.newValue}"</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Edit Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`input-field ${errors.expense_date ? 'border-red-300 dark:border-red-600' : ''}`}
                {...register('expense_date')}
              />
              {errors.expense_date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.expense_date.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                className={`input-field ${errors.category ? 'border-red-300 dark:border-red-600' : ''}`}
                {...register('category')}
              >
                <option value="">Select a category</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Sub Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sub Category
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Specific type within category"
                {...register('sub_category')}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                value={watchedValues.amount_paise || 0}
                onChange={(value) => setValue('amount_paise', value)}
                error={errors.amount_paise?.message}
              />
            </div>

            {/* Vendor Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field ${errors.vendor_name ? 'border-red-300 dark:border-red-600' : ''}`}
                placeholder="Name of vendor/supplier"
                {...register('vendor_name')}
              />
              {errors.vendor_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.vendor_name.message}
                </p>
              )}
            </div>

            {/* Vendor Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vendor Phone
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="Vendor contact number"
                {...register('vendor_phone')}
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                className={`input-field ${errors.payment_method ? 'border-red-300 dark:border-red-600' : ''}`}
                {...register('payment_method')}
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="dd">Demand Draft</option>
                <option value="neft">NEFT</option>
                <option value="rtgs">RTGS</option>
              </select>
              {errors.payment_method && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.payment_method.message}
                </p>
              )}
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Transaction/Reference number"
                {...register('reference_number')}
              />
            </div>

            {/* Bill Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bill Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field ${errors.bill_number ? 'border-red-300 dark:border-red-600' : ''}`}
                placeholder="Bill/Invoice number"
                {...register('bill_number')}
              />
              {errors.bill_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.bill_number.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className={`input-field ${errors.description ? 'border-red-300 dark:border-red-600' : ''}`}
              placeholder="Detailed description of the expense"
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Change Reason - Required for audit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason for Changes (Audit Trail) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className={`input-field ${errors.change_reason ? 'border-red-300 dark:border-red-600' : ''}`}
              placeholder="Detailed explanation of why these changes are being made (required for audit trail)"
              {...register('change_reason')}
            />
            {errors.change_reason && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.change_reason.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This information will be permanently recorded in the audit trail for transparency and compliance.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              className="input-field"
              placeholder="Any additional notes (optional)"
              {...register('notes')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/expenses/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updateExpenseMutation.isLoading}
              disabled={changes.length === 0}
              className={changes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {changes.length === 0 ? 'No Changes to Save' : `🔒 Save Changes (${changes.length})`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default EditExpensePage