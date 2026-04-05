import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCreateStudent } from '../../hooks/useStudents'
import { useStandards, useCurrentAcademicYear } from '../../hooks/useCommon'

const studentSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  roll_number: z.string().min(1, 'Roll number is required'),
  standard_id: z.string().min(1, 'Please select a standard'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Please select gender' }),
  dob: z.string().optional(),
  admission_date: z.string().optional(),
  guardian_name: z.string().optional(),
  phone: z.string().optional(),
  alt_phone: z.string().optional(),
  address: z.string().optional(),
  aadhaar_last4: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits').optional().or(z.literal('')),
  is_rte: z.boolean().default(false),
  notes: z.string().optional()
})

const AddStudentPage = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createStudentMutation = useCreateStudent()
  const { data: standards } = useStandards()
  const { data: currentAcademicYear } = useCurrentAcademicYear()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      is_rte: false,
      admission_date: new Date().toISOString().split('T')[0]
    }
  })

  const selectedStandardId = watch('standard_id')
  const selectedGender = watch('gender')

  const onSubmit = async (data) => {
    if (!currentAcademicYear) {
      toast.error('No current academic year found. Please contact administrator.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const studentData = {
        ...data,
        academic_year_id: currentAcademicYear.id,
        aadhaar_last4: data.aadhaar_last4 || null,
        dob: data.dob || null,
        admission_date: data.admission_date || null,
        status: 'active'
      }

      await createStudentMutation.mutateAsync(studentData)
      toast.success('Student added successfully!')
      navigate('/students')
    } catch (error) {
      console.error('Error adding student:', error)
      toast.error(error.message || 'Failed to add student')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get selected standard for fee preview
  const selectedStandard = standards?.find(s => s.id === selectedStandardId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
          <Link to="/students" className="hover:text-slate-900 dark:hover:text-slate-100">
            Students
          </Link>
          <span>/</span>
          <span>Add New Student</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Add New Student
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Enter student information to create a new record
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.full_name ? 'border-red-300 dark:border-red-600' : ''}`}
                  placeholder="Enter student's full name"
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.roll_number ? 'border-red-300 dark:border-red-600' : ''}`}
                  placeholder="Enter roll number"
                  {...register('roll_number')}
                />
                {errors.roll_number && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.roll_number.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Standard *
                </label>
                <select 
                  className={`input-field ${errors.standard_id ? 'border-red-300 dark:border-red-600' : ''}`}
                  {...register('standard_id')}
                >
                  <option value="">Select Standard</option>
                  {standards?.map(standard => (
                    <option key={standard.id} value={standard.id}>
                      {standard.name}
                    </option>
                  ))}
                </select>
                {errors.standard_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.standard_id.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Gender *
                </label>
                <select 
                  className={`input-field ${errors.gender ? 'border-red-300 dark:border-red-600' : ''}`}
                  {...register('gender')}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.gender.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="input-field"
                  {...register('dob')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Admission Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  {...register('admission_date')}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter guardian's name"
                  {...register('guardian_name')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  {...register('alt_phone')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Enter complete address"
                  {...register('address')}
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Documents & Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Aadhaar Last 4 Digits
                </label>
                <input
                  type="text"
                  maxLength="4"
                  className={`input-field ${errors.aadhaar_last4 ? 'border-red-300 dark:border-red-600' : ''}`}
                  placeholder="1234"
                  {...register('aadhaar_last4')}
                />
                {errors.aadhaar_last4 && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.aadhaar_last4.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  For security, only last 4 digits are stored
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_rte"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 rounded"
                    {...register('is_rte')}
                  />
                  <label htmlFor="is_rte" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                    Right to Education (RTE) Student (Zero Fee)
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Any additional notes about the student"
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          {/* Fee Preview */}
          {selectedStandard && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Fee Assignment Preview
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Based on the selected standard and gender, the annual fee will be automatically assigned.
              </p>
              <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Standard: <span className="font-medium text-slate-900 dark:text-slate-100">{selectedStandard.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-500 ml-2">(Fee will be assigned based on configuration)</span>
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Link
              to="/students"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Student...
                </>
              ) : (
                'Add Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddStudentPage