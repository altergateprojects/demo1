import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { usePromoteStudent, useValidatePromotion } from '../../hooks/useStudentPromotion'
import { useAcademicYears, useStandards } from '../../hooks/useCommon'
import { formatINR } from '../../lib/formatters'

const PromotionModal = ({ student, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    targetAcademicYearId: '',
    targetStandardId: '',
    promotionStatus: 'promoted',
    duesAction: 'carried_forward',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch data
  const { data: academicYears } = useAcademicYears()
  const { data: standards } = useStandards()
  const promoteStudentMutation = usePromoteStudent()

  // Get next academic year
  const nextYear = useMemo(() => {
    if (!academicYears) return null
    const currentYear = academicYears.find(y => y.is_current)
    if (!currentYear) return null
    
    // Find next year by start_date
    const sorted = [...academicYears].sort((a, b) => 
      new Date(a.start_date) - new Date(b.start_date)
    )
    const currentIndex = sorted.findIndex(y => y.id === currentYear.id)
    return sorted[currentIndex + 1] || null
  }, [academicYears])

  // Set default target year
  useEffect(() => {
    if (nextYear && !formData.targetAcademicYearId) {
      setFormData(prev => ({ ...prev, targetAcademicYearId: nextYear.id }))
    }
  }, [nextYear])

  // Get next standard (for promoted status)
  const nextStandard = useMemo(() => {
    if (!standards || !student) return null
    const currentStandard = standards.find(s => s.id === student.standard_id)
    if (!currentStandard) return null
    
    // Get the standard name (handle both 'name' and 'standard_name' columns)
    const standardName = currentStandard.standard_name || currentStandard.name
    if (!standardName) return null
    
    // Simple logic: find next standard by name (Class 1 -> Class 2, etc.)
    const currentNum = parseInt(standardName.match(/\d+/)?.[0])
    if (!currentNum) return null
    
    return standards.find(s => {
      const name = s.standard_name || s.name
      return name && name.includes(String(currentNum + 1))
    })
  }, [standards, student])

  // Set default target standard for promoted
  useEffect(() => {
    if (formData.promotionStatus === 'promoted' && nextStandard && !formData.targetStandardId) {
      setFormData(prev => ({ ...prev, targetStandardId: nextStandard.id }))
    } else if (formData.promotionStatus === 'repeated' && student) {
      setFormData(prev => ({ ...prev, targetStandardId: student.standard_id }))
    } else if (['left_school', 'graduated'].includes(formData.promotionStatus)) {
      setFormData(prev => ({ ...prev, targetStandardId: '' }))
    }
  }, [formData.promotionStatus, nextStandard, student])

  // Validate promotion
  const shouldValidate = Boolean(
    formData.promotionStatus === 'promoted' && 
    formData.targetStandardId && 
    formData.targetAcademicYearId
  )

  const { data: validation, isLoading: validating } = useValidatePromotion(
    student?.student_id,
    formData.targetStandardId,
    formData.targetAcademicYearId,
    shouldValidate
  )

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.targetAcademicYearId) {
      alert('Please select target academic year')
      return
    }

    if (formData.promotionStatus === 'promoted' && !formData.targetStandardId) {
      alert('Please select target standard')
      return
    }

    if (validation && !validation.eligible) {
      alert('Cannot promote: ' + validation.errors.join(', '))
      return
    }

    setIsSubmitting(true)

    try {
      const result = await promoteStudentMutation.mutateAsync({
        studentId: student.student_id,
        targetAcademicYearId: formData.targetAcademicYearId,
        targetStandardId: formData.targetStandardId || null,
        promotionStatus: formData.promotionStatus,
        duesAction: formData.duesAction,
        notes: formData.notes || null
      })

      if (result.success) {
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      console.error('Promotion error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPendingDues = student?.total_pending_dues_paise || 0
  const feeDue = student?.fee_due_paise || 0
  const pocketMoney = student?.pocket_money_paise || 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Promote Student"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
            Student Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600 dark:text-slate-400">Name:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                {student?.full_name}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Roll No:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                {student?.roll_number}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Current Standard:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                {student?.standard_name}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-3">
            Current Dues Breakdown
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-amber-700 dark:text-amber-300">Fee Due</div>
              <div className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                {formatINR(feeDue)}
              </div>
            </div>
            <div>
              <div className="text-amber-700 dark:text-amber-300">Pocket Money</div>
              <div className={`text-lg font-semibold ${
                pocketMoney < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {pocketMoney < 0 ? '-' : ''}{formatINR(Math.abs(pocketMoney))}
              </div>
            </div>
            <div>
              <div className="text-amber-700 dark:text-amber-300">Total Pending</div>
              <div className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                {formatINR(totalPendingDues)}
              </div>
            </div>
          </div>
        </div>

        {/* Target Academic Year */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Target Academic Year *
          </label>
          <select
            value={formData.targetAcademicYearId}
            onChange={(e) => handleChange('targetAcademicYearId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          >
            <option value="">Select Academic Year</option>
            {academicYears?.map(year => (
              <option key={year.id} value={year.id}>
                {year.year_label}
              </option>
            ))}
          </select>
        </div>

        {/* Promotion Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Promotion Action *
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="promotionStatus"
                value="promoted"
                checked={formData.promotionStatus === 'promoted'}
                onChange={(e) => handleChange('promotionStatus', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">Promoted</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Move student to next standard
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="promotionStatus"
                value="repeated"
                checked={formData.promotionStatus === 'repeated'}
                onChange={(e) => handleChange('promotionStatus', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">Repeated</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Student stays in same standard
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="promotionStatus"
                value="left_school"
                checked={formData.promotionStatus === 'left_school'}
                onChange={(e) => handleChange('promotionStatus', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">Left School</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Student is leaving the school
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="promotionStatus"
                value="graduated"
                checked={formData.promotionStatus === 'graduated'}
                onChange={(e) => handleChange('promotionStatus', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">Graduated</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Student is graduating (final year)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Target Standard (only for promoted/repeated) */}
        {['promoted', 'repeated'].includes(formData.promotionStatus) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Target Standard *
            </label>
            <select
              value={formData.targetStandardId}
              onChange={(e) => handleChange('targetStandardId', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            >
              <option value="">Select Standard</option>
              {standards?.map(standard => (
                <option key={standard.id} value={standard.id}>
                  {standard.standard_name || standard.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Validation Messages */}
        {validation && formData.promotionStatus === 'promoted' && (
          <div>
            {validation.errors && validation.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Cannot Promote:
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                  {validation.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings && validation.warnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Warnings:
                </div>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Dues Handling (only if there are pending dues) */}
        {totalPendingDues > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              How to handle pending dues? *
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="radio"
                  name="duesAction"
                  value="carried_forward"
                  checked={formData.duesAction === 'carried_forward'}
                  onChange={(e) => handleChange('duesAction', e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">Carry Forward</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Dues will be tracked and carried to next year
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="radio"
                  name="duesAction"
                  value="waived"
                  checked={formData.duesAction === 'waived'}
                  onChange={(e) => handleChange('duesAction', e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">Waive Dues</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Forgive all pending dues (requires approval)
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            placeholder="Add any notes about this promotion..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
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
            disabled={isSubmitting || validating || (validation && !validation.eligible)}
          >
            {isSubmitting ? 'Promoting...' : 'Promote Student'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default PromotionModal
