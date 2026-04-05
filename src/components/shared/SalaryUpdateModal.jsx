import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateSalaryHistory } from '../../hooks/useTeacherSalary'
import { formatINR } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'
import Select from '../ui/Select'

const salaryUpdateSchema = z.object({
  new_salary_paise: z.number().min(0, 'Salary cannot be negative'),
  effective_date: z.string().min(1, 'Effective date is required'),
  change_reason: z.string().min(1, 'Reason is required'),
  change_type: z.enum(['increment', 'decrement', 'adjustment'], {
    errorMap: () => ({ message: 'Please select a change type' })
  }),
  notes: z.string().optional()
})

const SalaryUpdateModal = ({ 
  isOpen, 
  onClose, 
  teacher
}) => {
  const createSalaryHistoryMutation = useCreateSalaryHistory()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger
  } = useForm({
    resolver: zodResolver(salaryUpdateSchema),
    defaultValues: {
      new_salary_paise: teacher?.current_salary_paise || 0,
      effective_date: new Date().toISOString().split('T')[0],
      change_type: 'increment'
    }
  })

  const watchedSalary = watch('new_salary_paise')
  const changeType = watch('change_type')

  const onSubmit = async (data) => {
    try {
      await createSalaryHistoryMutation.mutateAsync({
        ...data,
        teacher_id: teacher.id,
        old_salary_paise: teacher.current_salary_paise
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error updating salary:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!teacher) return null

  const currentSalary = teacher.current_salary_paise || 0
  const salaryDifference = watchedSalary - currentSalary

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Teacher Salary"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Teacher Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            {teacher.full_name}
          </h3>
          <div className="text-sm">
            <span className="text-slate-600 dark:text-slate-400">Current Salary:</span>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {formatINR(currentSalary)}
            </div>
          </div>
        </div>

        {/* Change Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Change Type
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            className={`input-field ${errors.change_type ? 'border-red-300 dark:border-red-600' : ''}`}
            {...register('change_type')}
          >
            <option value="increment">Salary Increment</option>
            <option value="decrement">Salary Decrement</option>
            <option value="adjustment">Salary Adjustment</option>
          </select>
          {errors.change_type && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.change_type.message}
            </p>
          )}
        </div>

        {/* New Salary */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            New Monthly Salary
            <span className="text-red-500 ml-1">*</span>
          </label>
          <CurrencyInput
            value={watchedSalary}
            onChange={(value) => {
              setValue('new_salary_paise', value)
              trigger('new_salary_paise')
            }}
            error={errors.new_salary_paise?.message}
            helperText={`Current: ${formatINR(currentSalary)}`}
          />
        </div>

        {/* Effective Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Effective Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            className={`input-field ${errors.effective_date ? 'border-red-300 dark:border-red-600' : ''}`}
            {...register('effective_date')}
          />
          {errors.effective_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.effective_date.message}
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Reason for Change
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            className={`input-field ${errors.change_reason ? 'border-red-300 dark:border-red-600' : ''}`}
            placeholder="e.g., Annual increment, Performance bonus, etc."
            {...register('change_reason')}
          />
          {errors.change_reason && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.change_reason.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Additional Notes
          </label>
          <textarea
            rows={3}
            className="input-field"
            placeholder="Any additional notes about this salary change"
            {...register('notes')}
          />
        </div>

        {/* Salary Change Preview */}
        {watchedSalary !== currentSalary && (
          <div className={`rounded-lg p-4 ${
            salaryDifference > 0 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <h3 className={`text-sm font-medium mb-2 ${
              salaryDifference > 0 
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              Salary Change Summary
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className={salaryDifference > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  Current Salary:
                </span>
                <span className="font-medium">{formatINR(currentSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className={salaryDifference > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  New Salary:
                </span>
                <span className="font-medium">{formatINR(watchedSalary)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className={`font-medium ${
                  salaryDifference > 0 
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {salaryDifference > 0 ? 'Increase:' : 'Decrease:'}
                </span>
                <span className="font-medium">
                  {salaryDifference > 0 ? '+' : ''}{formatINR(Math.abs(salaryDifference))}
                </span>
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
            disabled={createSalaryHistoryMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createSalaryHistoryMutation.isLoading}
            disabled={watchedSalary === currentSalary}
          >
            Update Salary
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SalaryUpdateModal