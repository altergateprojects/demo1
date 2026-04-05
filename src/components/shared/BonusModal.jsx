import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTeacherBonus } from '../../hooks/useTeacherSalary'
import { formatINR } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'
import Select from '../ui/Select'

const bonusSchema = z.object({
  bonus_type: z.enum(['performance', 'festival', 'annual', 'special', 'other']),
  amount_paise: z.number().min(100, 'Minimum bonus amount is ₹1'),
  bonus_date: z.string().min(1, 'Bonus date is required'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
  notes: z.string().optional()
})

const BonusModal = ({ 
  isOpen, 
  onClose, 
  teacher
}) => {
  const createBonusMutation = useCreateTeacherBonus()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(bonusSchema),
    defaultValues: {
      bonus_type: 'performance',
      amount_paise: 0,
      bonus_date: new Date().toISOString().split('T')[0]
    }
  })

  const watchedAmount = watch('amount_paise')
  const bonusType = watch('bonus_type')

  const onSubmit = async (data) => {
    try {
      await createBonusMutation.mutateAsync({
        ...data,
        teacher_id: teacher.id
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error creating bonus:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!teacher) return null

  const bonusTypeLabels = {
    performance: 'Performance Bonus',
    festival: 'Festival Bonus',
    annual: 'Annual Bonus',
    special: 'Special Bonus',
    other: 'Other Bonus'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Teacher Bonus"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Teacher Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            {teacher.full_name}
          </h3>
          <div className="text-sm">
            <span className="text-slate-600 dark:text-slate-400">Current Salary:</span>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {formatINR(teacher.current_salary_paise || 0)}
            </div>
          </div>
        </div>

        {/* Bonus Type */}
        <Select
          label="Bonus Type"
          required
          {...register('bonus_type')}
          error={errors.bonus_type?.message}
          options={[
            { value: 'performance', label: 'Performance Bonus' },
            { value: 'festival', label: 'Festival Bonus' },
            { value: 'annual', label: 'Annual Bonus' },
            { value: 'special', label: 'Special Bonus' },
            { value: 'other', label: 'Other Bonus' }
          ]}
        />

        {/* Bonus Amount */}
        <CurrencyInput
          label="Bonus Amount"
          required
          value={watchedAmount}
          onChange={(value) => setValue('amount_paise', value)}
          error={errors.amount_paise?.message}
          helperText="Enter the bonus amount"
        />

        {/* Bonus Date */}
        <Input
          label="Bonus Date"
          type="date"
          required
          {...register('bonus_date')}
          error={errors.bonus_date?.message}
        />

        {/* Reason */}
        <Input
          label="Reason"
          required
          {...register('reason')}
          error={errors.reason?.message}
          placeholder="e.g., Excellent performance in Q1, Diwali bonus, etc."
        />

        {/* Description */}
        <Input
          label="Description (Optional)"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Additional details about the bonus"
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="input-field"
            placeholder="Any additional notes about this bonus"
            {...register('notes')}
          />
        </div>

        {/* Bonus Preview */}
        {watchedAmount > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              Bonus Summary
            </h3>
            <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{bonusTypeLabels[bonusType]}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{formatINR(watchedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Teacher:</span>
                <span className="font-medium">{teacher.full_name}</span>
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
            disabled={createBonusMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createBonusMutation.isLoading}
            disabled={watchedAmount <= 0}
          >
            Add Bonus
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default BonusModal