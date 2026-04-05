import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import CurrencyInput from '../ui/CurrencyInput'
import { useCurrentAcademicYear, useAcademicYears, useStandards } from '../../hooks/useCommon'
import { useStudents } from '../../hooks/useStudents'

const AddManualDueModal = ({ isOpen, onClose, onSuccess }) => {
  const { data: currentYear } = useCurrentAcademicYear()
  const { data: academicYears } = useAcademicYears()
  const { data: standards } = useStandards()
  const { data: studentsData } = useStudents(currentYear?.id)
  
  const students = studentsData?.data || []

  const [formData, setFormData] = useState({
    student_status: 'studying', // studying, passed_out, left_school
    student_id: '',
    student_name: '',
    roll_number: '',
    current_standard_id: '',
    academic_year_id: '',
    // Changed to support both types
    add_fee_due: true,
    add_pocket_money_due: false,
    fee_amount_paise: 0,
    pocket_money_amount_paise: 0,
    description: '',
    due_date: new Date().toISOString().split('T')[0]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Reset student-related fields when status changes
      if (field === 'student_status') {
        updated.student_id = ''
        updated.student_name = ''
        updated.roll_number = ''
        updated.current_standard_id = ''
      }
      
      return updated
    })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation based on student status
    if (formData.student_status === 'studying') {
      if (!formData.student_id) {
        setError('Please select a student')
        return
      }
    } else {
      if (!formData.student_name || !formData.student_name.trim()) {
        setError('Please enter student name')
        return
      }
      if (!formData.roll_number || !formData.roll_number.trim()) {
        setError('Please enter roll number')
        return
      }
    }
    
    if (!formData.academic_year_id) {
      setError('Please select academic year')
      return
    }
    
    // Check if at least one due type is selected
    if (!formData.add_fee_due && !formData.add_pocket_money_due) {
      setError('Please select at least one due type (Fee or Pocket Money)')
      return
    }
    
    // Validate amounts for selected types
    if (formData.add_fee_due && formData.fee_amount_paise <= 0) {
      setError('Fee amount must be greater than zero')
      return
    }
    
    if (formData.add_pocket_money_due && formData.pocket_money_amount_paise <= 0) {
      setError('Pocket money amount must be greater than zero')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare base data
      const baseData = {
        academic_year_id: formData.academic_year_id,
        description: formData.description,
        due_date: formData.due_date
      }

      // Add student info based on status
      if (formData.student_status === 'studying') {
        baseData.student_id = formData.student_id
      } else {
        // For non-studying students, store info in description
        const statusLabel = formData.student_status === 'passed_out' ? 'Passed Out' : 'Left School'
        const studentInfo = `[${statusLabel}] ${formData.student_name} (Roll: ${formData.roll_number})${formData.current_standard_id ? ` - Last Standard: ${standards?.find(s => s.id === formData.current_standard_id)?.name}` : ''}`
        baseData.description = `${studentInfo}\n${formData.description}`
        baseData.student_id = formData.student_id || null
      }

      // Create array of dues to add
      const duesToAdd = []
      
      if (formData.add_fee_due) {
        duesToAdd.push({
          ...baseData,
          due_type: 'fee',
          amount_paise: formData.fee_amount_paise
        })
      }
      
      if (formData.add_pocket_money_due) {
        duesToAdd.push({
          ...baseData,
          due_type: 'pocket_money',
          amount_paise: formData.pocket_money_amount_paise
        })
      }

      // Add all dues
      for (const dueData of duesToAdd) {
        await onSuccess(dueData)
      }
      
      // Reset form
      setFormData({
        student_status: 'studying',
        student_id: '',
        student_name: '',
        roll_number: '',
        current_standard_id: '',
        academic_year_id: '',
        add_fee_due: true,
        add_pocket_money_due: false,
        fee_amount_paise: 0,
        pocket_money_amount_paise: 0,
        description: '',
        due_date: new Date().toISOString().split('T')[0]
      })
      
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add due')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Manual Due Entry"
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {/* Student Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Student Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.student_status}
              onChange={(e) => handleChange('student_status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="studying">Currently Studying in School</option>
              <option value="passed_out">Passed Out / Graduated</option>
              <option value="left_school">Left School / Transferred</option>
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select whether the student is currently in school or has left
            </p>
          </div>

          {/* Student Selection - For Currently Studying */}
          {formData.student_status === 'studying' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => handleChange('student_id', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">Select Student</option>
                {students?.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.roll_number} - {student.full_name} ({student.standards?.name})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Select from currently enrolled students
              </p>
            </div>
          )}

          {/* Manual Entry - For Passed Out / Left School */}
          {formData.student_status !== 'studying' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.student_name}
                    onChange={(e) => handleChange('student_name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Roll Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.roll_number}
                    onChange={(e) => handleChange('roll_number', e.target.value)}
                    placeholder="e.g., 001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last Standard / Class (Optional)
                </label>
                <select
                  value={formData.current_standard_id}
                  onChange={(e) => handleChange('current_standard_id', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Standard (Optional)</option>
                  {standards?.map(standard => (
                    <option key={standard.id} value={standard.id}>
                      {standard.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  The last standard/class the student was in
                </p>
              </div>
            </>
          )}

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Academic Year (When Due Originated) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.academic_year_id}
              onChange={(e) => handleChange('academic_year_id', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Academic Year</option>
              {academicYears?.map(year => (
                <option key={year.id} value={year.id}>
                  {year.year_label} {year.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select the year when this due was created. Only years in the system are shown.
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ If you need a year that's not listed, ask admin to create it in Academic Years first.
            </p>
          </div>

          {/* Due Types - Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Due Types <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {/* Fee Due Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={formData.add_fee_due}
                    onChange={(e) => handleChange('add_fee_due', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-primary-500"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Fee Due
                  </label>
                  {formData.add_fee_due && (
                    <div className="mt-2">
                      <CurrencyInput
                        value={formData.fee_amount_paise}
                        onChange={(value) => handleChange('fee_amount_paise', value)}
                        placeholder="Enter fee amount"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Pocket Money Due Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={formData.add_pocket_money_due}
                    onChange={(e) => handleChange('add_pocket_money_due', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-primary-500"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Pocket Money Due
                  </label>
                  {formData.add_pocket_money_due && (
                    <div className="mt-2">
                      <CurrencyInput
                        value={formData.pocket_money_amount_paise}
                        onChange={(value) => handleChange('pocket_money_amount_paise', value)}
                        placeholder="Enter pocket money amount"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Select one or both types. You can add fee and pocket money dues together.
            </p>
          </div>

          {/* Summary Box - Show total if both selected */}
          {formData.add_fee_due && formData.add_pocket_money_due && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Amount:
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ₹{((formData.fee_amount_paise + formData.pocket_money_amount_paise) / 100).toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Fee Due:</span>
                  <span>₹{(formData.fee_amount_paise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pocket Money Due:</span>
                  <span>₹{(formData.pocket_money_amount_paise / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Date when this due was recorded
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="e.g., Pending fees from before system implementation, reason for leaving, etc."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add any additional context about this due
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {formData.student_status === 'studying' ? 'Current Student' : 
                   formData.student_status === 'passed_out' ? 'Passed Out Student' : 'Left School Student'}
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  {formData.student_status === 'studying' ? (
                    <p>Recording due for a student currently enrolled in the school. You can add both fee and pocket money dues at once.</p>
                  ) : formData.student_status === 'passed_out' ? (
                    <p>Recording due for a student who has graduated/passed out. Enter their details manually. You can add both types of dues together.</p>
                  ) : (
                    <p>Recording due for a student who left/transferred. Enter their details manually. You can add both types of dues together.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Add Due
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddManualDueModal
