import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTeacher, useUpdateTeacher } from '../../hooks/useTeachers'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'

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
  notes: z.string().optional()
})

const EditTeacherPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: teacher, isLoading, error } = useTeacher(id)
  const updateTeacherMutation = useUpdateTeacher()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      status: 'active',
      experience_years: 0
    }
  })

  // Reset form when teacher data is loaded
  useEffect(() => {
    if (teacher) {
      reset({
        full_name: teacher.full_name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        subject: teacher.subject || '',
        qualification: teacher.qualification || '',
        experience_years: teacher.experience_years || 0,
        address: teacher.address || '',
        emergency_contact: teacher.emergency_contact || '',
        emergency_phone: teacher.emergency_phone || '',
        status: teacher.status || 'active',
        notes: teacher.notes || ''
      })
    }
  }, [teacher, reset])

  const onSubmit = async (data) => {
    try {
      // Clean up empty strings
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '')
      )
      
      await updateTeacherMutation.mutateAsync({ id, updates: cleanData })
      navigate('/teachers')
    } catch (error) {
      console.error('Error updating teacher:', error)
    }
  }

  if (isLoading) return <LoadingScreen />

  if (error || !teacher) {
    return (
      <EmptyState
        title="Teacher Not Found"
        description="The teacher you're looking for doesn't exist or has been deleted."
        action={
          <Button onClick={() => navigate('/teachers')}>
            Back to Teachers
          </Button>
        }
      />
    )
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
          <span>{teacher.full_name}</span>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Edit Teacher
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Update {teacher.full_name}'s information
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
              disabled={updateTeacherMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updateTeacherMutation.isLoading}
            >
              Update Teacher
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTeacherPage