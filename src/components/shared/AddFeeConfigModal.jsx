import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateFeeConfiguration } from '../../hooks/useFees'
import { useAcademicYears, useStandards } from '../../hooks/useCommon'
import Modal from '../ui/Modal'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'
import useAuthStore from '../../store/authStore'

const feeConfigSchema = z.object({
  academic_year_id: z.string().min(1, 'Academic year is required'),
  standard_id: z.string().min(1, 'Standard is required'),
  gender: z.enum(['male', 'female', 'other', 'all']),
  annual_fee_paise: z.number().min(0, 'Annual fee cannot be negative'),
  notes: z.string().optional()
})

const AddFeeConfigModal = ({ isOpen, onClose, editData = null }) => {
  const { user } = useAuthStore()
  const { data: academicYears } = useAcademicYears()
  const { data: standards } = useStandards()
  const createFeeConfigMutation = useCreateFeeConfiguration()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(feeConfigSchema),
    defaultValues: {
      academic_year_id: editData?.academic_year_id || '',
      standard_id: editData?.standard_id || '',
      gender: editData?.gender || 'all',
      annual_fee_paise: editData?.annual_fee_paise || 0,
      notes: editData?.notes || ''
    }
  })

  const watchedAmount = watch('annual_fee_paise')

  const onSubmit = async (data) => {
    try {
      console.log('Submitting fee configuration:', data)
      
      await createFeeConfigMutation.mutateAsync({
        ...data,
        created_by: user?.id,
        is_active: true
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error creating fee configuration:', error)
      
      // Handle different types of errors
      let errorMessage = 'Failed to create fee configuration'
      
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = '⚠️ A fee configuration already exists for this Academic Year + Standard + Gender combination.\n\nPlease:\n• Choose different values, or\n• Edit the existing configuration instead'
      } else if (error.message?.includes('foreign key')) {
        errorMessage = '⚠️ Invalid selection detected.\n\nPlease:\n• Refresh the page and try again\n• Ensure all dropdowns have valid selections'
      } else if (error.message?.includes('permission') || error.message?.includes('RLS')) {
        errorMessage = '⚠️ Permission denied.\n\nPlease:\n• Ensure you are logged in\n• Contact administrator if issue persists'
      } else {
        errorMessage = `⚠️ ${error.message || 'Unknown error occurred'}\n\nPlease try again or contact support.`
      }
      
      alert(errorMessage)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const academicYearOptions = academicYears?.map(year => ({
    value: year.id,
    label: year.year_label
  })) || []

  const standardOptions = standards?.map(standard => ({
    value: standard.id,
    label: standard.name
  })) || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editData ? "Edit Fee Configuration" : "Add Fee Configuration"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Academic Year */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Academic Year
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            {...register('academic_year_id')}
            className={`input-field ${errors.academic_year_id ? 'border-red-500' : ''}`}
          >
            <option value="">Select Academic Year</option>
            {academicYearOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.academic_year_id && (
            <p className="mt-1 text-sm text-red-600">{errors.academic_year_id.message}</p>
          )}
        </div>

        {/* Standard */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Standard
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            {...register('standard_id')}
            className={`input-field ${errors.standard_id ? 'border-red-500' : ''}`}
          >
            <option value="">Select Standard</option>
            {standardOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.standard_id && (
            <p className="mt-1 text-sm text-red-600">{errors.standard_id.message}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Gender
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            {...register('gender')}
            className={`input-field ${errors.gender ? 'border-red-500' : ''}`}
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

        {/* Annual Fee */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Annual Fee
            <span className="text-red-500 ml-1">*</span>
          </label>
          <CurrencyInput
            value={watchedAmount}
            onChange={(value) => setValue('annual_fee_paise', value)}
            error={errors.annual_fee_paise?.message}
            helperText="Enter the annual fee amount for this standard and gender"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes
          </label>
          <textarea
            rows={3}
            className="input-field"
            placeholder="Additional notes about this fee configuration (optional)"
            {...register('notes')}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createFeeConfigMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createFeeConfigMutation.isLoading}
          >
            {editData ? 'Update Configuration' : 'Add Configuration'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddFeeConfigModal