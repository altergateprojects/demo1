import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateExpense } from '../../hooks/useExpenses'
import { EXPENSE_CATEGORIES } from '../../api/expenses.api'
import { formatINR, formatDate } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
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
  bill_number: z.string().min(1, 'Bill number is required'),
  notes: z.string().optional(),
  change_reason: z.string().min(10, 'Detailed reason for changes is required (minimum 10 characters)')
})

const EditExpenseModal = ({ isOpen, onClose, expense }) => {
  const { user } = useAuthStore()
  const updateExpenseMutation = useUpdateExpense()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [changes, setChanges] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(editExpenseSchema),
    defaultValues: expense ? {
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
    } : {}
  })

  const watchedValues = watch()

  // Track changes
  useEffect(() => {
    if (!expense) return

    const detectedChanges = []
    
    if (watchedValues.amount_paise !== expense.amount_paise) {
      detectedChanges.push({
        field: 'Amount',
        from: formatINR(expense.amount_paise),
        to: formatINR(watchedValues.amount_paise)
      })
    }
    
    if (watchedValues.description !== expense.description) {
      detectedChanges.push({
        field: 'Description',
        from: expense.description,
        to: watchedValues.description
      })
    }
    
    if (watchedValues.vendor_name !== expense.vendor_name) {
      detectedChanges.push({
        field: 'Vendor Name',
        from: expense.vendor_name,
        to: watchedValues.vendor_name
      })
    }
    
    if (watchedValues.category !== expense.category) {
      detectedChanges.push({
        field: 'Category',
        from: expense.category,
        to: watchedValues.category
      })
    }

    setChanges(detectedChanges)
  }, [watchedValues, expense])

  const onSubmit = async (data) => {
    if (changes.length === 0) {
      alert('No changes detected. Please modify at least one field to update the expense.')
      return
    }

    if (!data.change_reason.trim()) {
      alert('Please provide a detailed reason for these changes.')
      return
    }

    setIsSubmitting(true)
    try {
      await updateExpenseMutation.mutateAsync({
        id: expense.id,
        updates: {
          ...data,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
          // Track the changes in the update
          audit_changes: changes,
          audit_reason: data.change_reason
        }
      })
      
      alert('✅ Expense updated successfully!\n\n📋 All changes have been recorded in the audit trail for transparency.')
      
      reset()
      onClose()
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Failed to update expense. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    reset()
    setChanges([])
    onClose()
  }

  if (!expense) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`🔒 Edit Expense #${expense.expense_number || expense.id.slice(0, 8)}`}
      size="xl"
    >
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Audit Trail Notice
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              All changes will be permanently recorded in the audit trail. Original values are preserved for transparency.
            </p>
          </div>
        </div>
      </div>

      {/* Original Expense Info */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Original Expense Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">Amount:</span>
            <span className="ml-2 font-medium">{formatINR(expense.amount_paise)}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Date:</span>
            <span className="ml-2 font-medium">{formatDate(expense.expense_date)}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Category:</span>
            <span className="ml-2 font-medium">{expense.category}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Vendor:</span>
            <span className="ml-2 font-medium">{expense.vendor_name}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expense Date
              <span className="text-red-500 ml-1">*</span>
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
          <Select
            label="Category"
            required
            {...register('category')}
            error={errors.category?.message}
            options={EXPENSE_CATEGORIES}
          />

          {/* Sub Category */}
          <Input
            label="Sub Category"
            {...register('sub_category')}
            error={errors.sub_category?.message}
            placeholder="Specific type within category"
          />

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount
              <span className="text-red-500 ml-1">*</span>
            </label>
            <CurrencyInput
              value={watchedValues.amount_paise}
              onChange={(value) => setValue('amount_paise', value)}
              error={errors.amount_paise?.message}
            />
          </div>

          {/* Vendor Name */}
          <Input
            label="Vendor Name"
            required
            {...register('vendor_name')}
            error={errors.vendor_name?.message}
            placeholder="Name of vendor/supplier"
          />

          {/* Vendor Phone */}
          <Input
            label="Vendor Phone"
            type="tel"
            {...register('vendor_phone')}
            error={errors.vendor_phone?.message}
            placeholder="Vendor contact number"
          />

          {/* Payment Method */}
          <Select
            label="Payment Method"
            required
            {...register('payment_method')}
            error={errors.payment_method?.message}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'upi', label: 'UPI' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'dd', label: 'Demand Draft' },
              { value: 'neft', label: 'NEFT' },
              { value: 'rtgs', label: 'RTGS' }
            ]}
          />

          {/* Reference Number */}
          <Input
            label="Reference Number"
            {...register('reference_number')}
            error={errors.reference_number?.message}
            placeholder="Transaction/Reference number"
          />

          {/* Bill Number */}
          <Input
            label="Bill Number"
            required
            {...register('bill_number')}
            error={errors.bill_number?.message}
            placeholder="Bill/Invoice number"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
            <span className="text-red-500 ml-1">*</span>
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

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Additional Notes
          </label>
          <textarea
            rows={2}
            className="input-field"
            placeholder="Any additional notes"
            {...register('notes')}
          />
        </div>

        {/* Changes Summary */}
        {changes.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              📝 Detected Changes ({changes.length})
            </h4>
            <div className="space-y-2">
              {changes.map((change, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-amber-900 dark:text-amber-100">
                    {change.field}:
                  </span>
                  <span className="text-amber-700 dark:text-amber-300 ml-2">
                    {change.from} → {change.to}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Reason */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Reason for Changes
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            rows={3}
            className={`input-field ${errors.change_reason ? 'border-red-300 dark:border-red-600' : ''}`}
            placeholder="Provide a detailed explanation for why these changes are necessary (required for audit trail)"
            {...register('change_reason')}
          />
          {errors.change_reason && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.change_reason.message}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={changes.length === 0}
          >
            🔒 Update Expense (Audit Trail)
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EditExpenseModal