import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useStudent, useUpdateStudent } from '../../hooks/useStudents'
import { useStandards } from '../../hooks/useCommon'
import LoadingScreen from '../../components/ui/LoadingScreen'
import Button from '../../components/ui/Button'

const EditStudentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: student, isLoading, error } = useStudent(id)
  const { data: standards } = useStandards()
  const updateStudentMutation = useUpdateStudent()

  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    standard_id: '',
    gender: '',
    date_of_birth: '',
    admission_date: '',
    guardian_name: '',
    phone_number: '',
    alternate_phone: '',
    address: '',
    aadhaar_last_4: '',
    is_rte: false,
    notes: '',
    status: 'active',
    status_change_reason: ''
  })

  // Update form data when student data is loaded
  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        roll_number: student.roll_number || '',
        standard_id: student.standard_id || '',
        gender: student.gender || '',
        date_of_birth: student.date_of_birth || '',
        admission_date: student.admission_date || '',
        guardian_name: student.guardian_name || '',
        phone_number: student.phone_number || '',
        alternate_phone: student.alternate_phone || '',
        address: student.address || '',
        aadhaar_last_4: student.aadhaar_last_4 || '',
        is_rte: student.is_rte || false,
        notes: student.notes || '',
        status: student.status || 'active',
        status_change_reason: ''
      })
    }
  }, [student])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Remove status_change_reason from the update data if it's empty
      const updateData = { ...formData }
      if (!updateData.status_change_reason) {
        delete updateData.status_change_reason
      }
      
      await updateStudentMutation.mutateAsync({
        id: student.id,
        updates: updateData
      })
      
      // Navigate back to student detail page
      navigate(`/students/${id}`)
    } catch (error) {
      console.error('Error updating student:', error)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Error loading student: {error.message}</p>
        <Link to="/students" className="btn-primary mt-4">
          Back to Students
        </Link>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Student not found</p>
        <Link to="/students" className="btn-primary mt-4">
          Back to Students
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
          <Link to="/students" className="hover:text-slate-900 dark:hover:text-slate-100">
            Students
          </Link>
          <span>/</span>
          <Link to={`/students/${id}`} className="hover:text-slate-900 dark:hover:text-slate-100">
            {student.full_name}
          </Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Edit Student: {student.full_name}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Update student information
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
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
                  name="full_name"
                  className="input-field"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  name="roll_number"
                  className="input-field"
                  value={formData.roll_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Standard *
                </label>
                <select 
                  name="standard_id"
                  className="input-field" 
                  value={formData.standard_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Standard</option>
                  {standards?.map((standard) => (
                    <option key={standard.id} value={standard.id}>
                      {standard.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Gender *
                </label>
                <select 
                  name="gender"
                  className="input-field" 
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  className="input-field"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Admission Date
                </label>
                <input
                  type="date"
                  name="admission_date"
                  className="input-field"
                  value={formData.admission_date}
                  onChange={handleInputChange}
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
                  name="guardian_name"
                  className="input-field"
                  value={formData.guardian_name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  className="input-field"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  name="alternate_phone"
                  className="input-field"
                  value={formData.alternate_phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <textarea
                  rows={3}
                  name="address"
                  className="input-field"
                  value={formData.address}
                  onChange={handleInputChange}
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
                  name="aadhaar_last_4"
                  maxLength="4"
                  className="input-field"
                  value={formData.aadhaar_last_4}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  For security, only last 4 digits are stored
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Update Student Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_rte"
                    name="is_rte"
                    checked={formData.is_rte}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 rounded"
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
                  name="notes"
                  className="input-field"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Status Change */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Status Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Student Status
                </label>
                <select 
                  name="status"
                  className="input-field" 
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status Change Reason (if changing status)
                </label>
                <input
                  type="text"
                  name="status_change_reason"
                  className="input-field"
                  value={formData.status_change_reason}
                  onChange={handleInputChange}
                  placeholder="Reason for status change"
                />
              </div>
            </div>
          </div>

          {/* Warning for financial records */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Important Note
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  This student has existing financial records (fee payments, pocket money transactions). 
                  Changes to basic information will be logged in the audit trail. Fee-related changes 
                  require separate transactions and cannot be modified directly.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Link
              to={`/students/${id}`}
              className="btn-secondary"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              loading={updateStudentMutation.isLoading}
              disabled={updateStudentMutation.isLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditStudentPage