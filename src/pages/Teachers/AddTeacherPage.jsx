import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTeacher } from '../../hooks/useTeachers'
import { useCreateSalaryHistory } from '../../hooks/useTeacherSalary'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import CurrencyInput from '../../components/ui/CurrencyInput'

const teacherSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  subject: z.string().optional(),
  qualification: z.string().optional(),
  experience_years: z.number().min(0, 'Experience cannot be negative').optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  notes: z.string().optional(),
  // Salary fields
  current_salary_paise: z.number().min(0, 'Salary cannot be negative'),
  salary_effective_date: z.string().optional(),
  salary_notes: z.string().optional()
})

const AddTeacherPage = () => {
  const navigate = useNavigate()
  const createTeacherMutation = useCreateTeacher()
  const createSalaryHistoryMutation = useCreateSalaryHistory()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      status: 'active',
      experience_years: 0,
      current_salary_paise: 0,
      salary_effective_date: new Date().toISOString().split('T')[0]
    }
  })

  const watchedSalary = watch('current_salary_paise')

  const onSubmit = async (data) => {
    try {
      // Clean up empty strings
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '')
      )
      
      // Create teacher first
      const teacher = await createTeacherMutation.mutateAsync(cleanData)
      
      // If salary is provided, create initial salary history record
      if (cleanData.current_salary_paise > 0) {
        await createSalaryHistoryMutation.mutateAsync({
          teacher_id: teacher.id,
          old_salary_paise: null,
          new_salary_paise: cleanData.current_salary_paise,
          effective_date: cleanData.salary_effective_date || new Date().toISOString().split('T')[0],
          change_reason: 'Initial salary assignment',
          change_type: 'initial',
          notes: cleanData.salary_notes || 'Initial salary set during teacher creation'
        })
      }
      
      navigate('/teachers')
    } catch (error) {
      console.error('Error creating teacher:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
          <button 
            onClick={() => navigate('/teachers')}
            className="hover:text-slate-900 dark:hover:text-slate-100"
          >
            Teachers
          </button>
          <span>/</span>
          <span>Add Teacher</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Add New Teacher
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Add a new teacher to your school's staff
        </p>
      </div>

      {/* Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                required
                {...register('full_name')}
                error={errors.full_name?.message}
                placeholder="Enter teacher's full name"
              />

              <Select
                label="Status"
                required
                {...register('status')}
                error={errors.status?.message}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />

              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="teacher@school.com"
              />

              <Input
                label="Phone Number"
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="Enter phone number"
              />

              <Input
                label="Subject/Department"
                {...register('subject')}
                error={errors.subject?.message}
                placeholder="e.g., Mathematics, English, Science"
              />

              <Input
                label="Experience (Years)"
                type="number"
                min="0"
                {...register('experience_years', { valueAsNumber: true })}
                error={errors.experience_years?.message}
                placeholder="0"
              />
            </div>
          </div>

          {/* Salary Information */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
              Salary Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CurrencyInput
                label="Monthly Salary"
                required
                value={watchedSalary}
                onChange={(value) => setValue('current_salary_paise', value)}
                error={errors.current_salary_paise?.message}
                helperText="Enter the monthly salary amount"
              />

              <Input
                label="Salary Effective Date"
                type="date"
                {...register('salary_effective_date')}
                error={errors.salary_effective_date?.message}
              />

              <div className="md:col-span-2">
                <Input
                  label="Salary Notes"
                  {...register('salary_notes')}
                  error={errors.salary_notes?.message}
                  placeholder="Any notes about the salary (optional)"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Qualification"
                {...register('qualification')}
                error={errors.qualification?.message}
                placeholder="e.g., B.Ed, M.A., Ph.D"
              />

              <Input
                label="Emergency Contact Name"
                {...register('emergency_contact')}
                error={errors.emergency_contact?.message}
                placeholder="Emergency contact person"
              />

              <div className="md:col-span-2">
                <Input
                  label="Address"
                  {...register('address')}
                  error={errors.address?.message}
                  placeholder="Enter full address"
                />
              </div>

              <Input
                label="Emergency Phone"
                type="tel"
                {...register('emergency_phone')}
                error={errors.emergency_phone?.message}
                placeholder="Emergency contact number"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Any additional notes about the teacher"
                  {...register('notes')}
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.notes.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/teachers')}
              disabled={createTeacherMutation.isLoading || createSalaryHistoryMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createTeacherMutation.isLoading || createSalaryHistoryMutation.isLoading}
            >
              Add Teacher
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTeacherPage