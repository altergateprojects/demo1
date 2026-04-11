import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'
import { useQueryClient } from '@tanstack/react-query'

// Predefined debit categories
const DEBIT_CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'forms', label: 'Forms' },
  { value: 'sports', label: 'Sports' },
  { value: 'haircut', label: 'Hair Cut' },
  { value: 'festival', label: 'Festival Fee' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'books', label: 'Books' },
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food/Lunch' },
  { value: 'other', label: 'Other' }
]

const bulkDebitSchema = z.object({
  amount_paise: z.number().min(100, 'Minimum amount is ₹1'),
  debit_category: z.string().min(1, 'Category is required'),
  standard_id: z.string().optional(),
  gender: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.string().optional()
}).refine((data) => {
  // If category is "other", notes must be provided
  if (data.debit_category === 'other') {
    return data.notes && data.notes.trim().length > 0
  }
  return true
}, {
  message: 'Notes are required when "Other" category is selected',
  path: ['notes']
})

const BulkPocketMoneyDebitModal = ({ isOpen, onClose, students }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm({
    resolver: zodResolver(bulkDebitSchema),
    defaultValues: {
      amount_paise: 0,
      debit_category: '',
      standard_id: '',
      gender: '',
      notes: '',
      transaction_date: new Date().toISOString().split('T')[0]
    }
  })

  const watchedAmount = watch('amount_paise')
  const watchedStandard = watch('standard_id')
  const watchedGender = watch('gender')
  const watchedCategory = watch('debit_category')

  // Filter students based on criteria
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesStandard = !watchedStandard || student.standard_id === watchedStandard
      const matchesGender = !watchedGender || student.gender === watchedGender
      return matchesStandard && matchesGender && student.status === 'active'
    })
  }, [students, watchedStandard, watchedGender])

  // Get unique standards
  const standards = useMemo(() => {
    const standardsMap = new Map()
    students.forEach(s => {
      if (s.standard_id && !standardsMap.has(s.standard_id)) {
        standardsMap.set(s.standard_id, {
          id: s.standard_id,
          name: s.standards?.name || 'Unknown'
        })
      }
    })
    return Array.from(standardsMap.values()).sort((a, b) => a.name?.localeCompare(b.name))
  }, [students])

  const onSubmit = async (data) => {
    if (filteredStudents.length === 0) {
      toast.error('No students match the selected criteria')
      return
    }

    const confirmed = window.confirm(
      `This will debit ${formatINR(data.amount_paise)} from ${filteredStudents.length} student(s). Continue?`
    )

    if (!confirmed) return

    setIsProcessing(true)

    try {
      // Get category label for description
      const category = DEBIT_CATEGORIES.find(c => c.value === data.debit_category)
      const description = category ? category.label : 'Bulk debit'

      // Get current user and academic year
      const { data: { user } } = await supabase.auth.getUser()
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single()

      if (!academicYear) {
        toast.error('No current academic year found')
        setIsProcessing(false)
        return
      }

      // Process each student using direct insert
      const results = await Promise.allSettled(
        filteredStudents.map(async (student) => {
          const transaction = {
            student_id: student.id,
            amount_paise: data.amount_paise,
            transaction_type: 'debit',
            description: description,
            notes: data.notes || `Bulk debit - ${description}`,
            transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
            academic_year_id: academicYear.id,
            performed_by: user.id
          }

          const { error } = await supabase
            .from('pocket_money_transactions')
            .insert([transaction])

          if (error) throw error
          return student.full_name
        })
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`Successfully debited ${successful} student(s)`)
        queryClient.invalidateQueries(['students'])
        reset()
        onClose()
      }

      if (failed > 0) {
        toast.error(`Failed to debit ${failed} student(s)`)
      }
    } catch (error) {
      console.error('Bulk debit error:', error)
      toast.error('Failed to process bulk debit')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Calculate total debit amount
  const totalDebitAmount = watchedAmount * filteredStudents.length

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Pocket Money Debit"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Bulk Debit Operation
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Debit the same amount from multiple students at once. Select filters to target specific groups.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Filter by Standard (Optional)"
            placeholder="All Standards"
            options={standards.map(s => ({ value: s.id, label: s.name }))}
            {...register('standard_id')}
            error={errors.standard_id?.message}
          />
          <Select
            label="Filter by Gender (Optional)"
            placeholder="All Genders"
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]}
            {...register('gender')}
            error={errors.gender?.message}
          />
        </div>

        {/* Selected Students Count */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Students Selected</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {filteredStudents.length}
              </div>
            </div>
            {filteredStudents.length > 0 && watchedAmount > 0 && (
              <div className="text-right">
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Debit Amount</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatINR(totalDebitAmount)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <CurrencyInput
          label="Amount per Student"
          required
          value={watchedAmount}
          onChange={(value) => setValue('amount_paise', value)}
          error={errors.amount_paise?.message}
          helperText="This amount will be debited from each selected student"
        />

        {/* Category */}
        <Select
          label="Category"
          required
          placeholder="Select debit category"
          options={DEBIT_CATEGORIES}
          {...register('debit_category')}
          error={errors.debit_category?.message}
        />

        {/* Transaction Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Transaction Date
          </label>
          <input
            type="date"
            className="input-field"
            {...register('transaction_date')}
          />
        </div>

        {/* Notes - Required when "Other" is selected */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes {watchedCategory === 'other' && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <textarea
            rows={3}
            className={`input-field ${errors.notes ? 'border-red-300 dark:border-red-600' : ''}`}
            placeholder={
              watchedCategory === 'other'
                ? 'Please specify the reason for debit (required)'
                : 'Any additional notes about this bulk debit'
            }
            {...register('notes')}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.notes.message}
            </p>
          )}
          {watchedCategory === 'other' && (
            <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
              Notes are required when "Other" category is selected
            </p>
          )}
        </div>

        {/* Warning */}
        {filteredStudents.length > 0 && watchedAmount > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Confirm Bulk Operation
                </h3>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  You are about to debit {formatINR(watchedAmount)} from {filteredStudents.length} student(s).
                  Total amount: {formatINR(totalDebitAmount)}. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isProcessing}
            disabled={filteredStudents.length === 0 || watchedAmount <= 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Debit {filteredStudents.length} Student(s)
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default BulkPocketMoneyDebitModal
