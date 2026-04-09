import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useBulkPromotion, useValidatePromotion } from '../../hooks/useStudentPromotion'
import { useAcademicYears, useStandards } from '../../hooks/useCommon'
import { formatINR } from '../../lib/formatters'

const BulkPromotionModal = ({ students, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    targetAcademicYearId: '',
    targetStandardId: '',
    promotionStatus: 'promoted',
    duesAction: 'carried_forward',
    batchName: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)

  // Fetch data
  const { data: academicYears } = useAcademicYears()
  const { data: standards } = useStandards()
  const bulkPromotionMutation = useBulkPromotion()

  // Get source standard (all students should be from same standard)
  const sourceStandard = useMemo(() => {
    if (!students || students.length === 0) return null
    const standardId = students[0].standard_id
    return standards?.find(s => s.id === standardId)
  }, [students, standards])

  // Get next standard based on source standard
  const nextStandard = useMemo(() => {
    if (!sourceStandard || !standards) return null
    
    // Sort standards by display order or name
    const sortedStandards = [...standards].sort((a, b) => {
      // If there's a display_order field, use it
      if (a.display_order !== undefined && b.display_order !== undefined) {
        return a.display_order - b.display_order
      }
      // Otherwise sort by name
      return (a.standard_name || a.name).localeCompare(b.standard_name || b.name)
    })
    
    const currentIndex = sortedStandards.findIndex(s => s.id === sourceStandard.id)
    if (currentIndex === -1 || currentIndex === sortedStandards.length - 1) {
      return null // No next standard (final year)
    }
    
    return sortedStandards[currentIndex + 1]
  }, [sourceStandard, standards])

  // Get next academic year
  const nextYear = useMemo(() => {
    if (!academicYears) return null
    const currentYear = academicYears.find(y => y.is_current)
    if (!currentYear) return null
    
    const sorted = [...academicYears].sort((a, b) => 
      new Date(a.start_date) - new Date(b.start_date)
    )
    const currentIndex = sorted.findIndex(y => y.id === currentYear.id)
    return sorted[currentIndex + 1] || null
  }, [academicYears])

  // Set default target year and standard
  useEffect(() => {
    if (nextYear && !formData.targetAcademicYearId) {
      setFormData(prev => ({ ...prev, targetAcademicYearId: nextYear.id }))
    }
    if (nextStandard && !formData.targetStandardId) {
      setFormData(prev => ({ ...prev, targetStandardId: nextStandard.id }))
    }
  }, [nextYear, nextStandard])

  // Calculate totals
  const totals = useMemo(() => {
    return students.reduce((acc, student) => {
      acc.totalDues += student.total_pending_dues_paise || 0
      acc.totalFeeDues += student.fee_due_paise || 0
      acc.totalNegativePocketMoney += Math.min(student.pocket_money_paise || 0, 0)
      return acc
    }, { totalDues: 0, totalFeeDues: 0, totalNegativePocketMoney: 0 })
  }, [students])

  // Validate first student (as sample) - only for promoted status
  const shouldValidate = Boolean(
    formData.promotionStatus === 'promoted' && 
    formData.targetStandardId && 
    formData.targetAcademicYearId &&
    students.length > 0 &&
    nextStandard
  )

  const { data: validation, isLoading: validating } = useValidatePromotion(
    students[0]?.student_id,
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

    if (formData.promotionStatus === 'promoted') {
      if (!nextStandard) {
        alert('Cannot promote: No next standard available. Students are in final year. Please use "Graduated" status instead.')
        return
      }
      if (!formData.targetStandardId) {
        alert('Please select target standard')
        return
      }
    }

    if (validation && !validation.eligible && formData.promotionStatus === 'promoted') {
      alert('Cannot promote: ' + validation.errors.join(', '))
      return
    }

    setIsSubmitting(true)

    try {
      const studentIds = students.map(s => s.student_id)
      const batchName = formData.batchName || 
        `${sourceStandard?.standard_name || sourceStandard?.name} - ${formData.promotionStatus} - ${new Date().toLocaleDateString()}`

      const result = await bulkPromotionMutation.mutateAsync({
        studentIds,
        targetAcademicYearId: formData.targetAcademicYearId,
        targetStandardId: formData.targetStandardId || null,
        promotionStatus: formData.promotionStatus,
        duesAction: formData.duesAction,
        batchName
      })

      if (result.success) {
        setResults(result)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Bulk promotion error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (showResults && results?.successful > 0) {
      onSuccess?.()
    }
    setShowResults(false)
    setResults(null)
    onClose()
  }

  // Results view
  if (showResults && results) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Bulk Promotion Results"
        size="lg"
      >
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {results.totalProcessed}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Processed</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {results.successful}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Successful</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {results.failed}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
            </div>
          </div>

          {/* Failed promotions details */}
          {results.failed > 0 && results.results && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Failed Promotions
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {results.results
                  .filter(r => !r.success)
                  .map((result, idx) => {
                    const student = students.find(s => s.student_id === result.student_id)
                    return (
                      <div 
                        key={idx}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                      >
                        <div className="font-medium text-red-900 dark:text-red-100">
                          {student?.full_name || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {result.error}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Success message */}
          {results.successful > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-sm text-green-800 dark:text-green-200">
                ✓ Successfully promoted {results.successful} student{results.successful !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="primary"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  // Form view
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Promote Students"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selected Students Summary */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
          <h3 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-3">
            Selected Students ({students.length})
          </h3>
          <div className="mb-3 p-2 bg-white dark:bg-slate-800 rounded border border-primary-200 dark:border-primary-700">
            <div className="text-xs text-primary-700 dark:text-primary-300 mb-1">Source Standard:</div>
            <div className="text-sm font-semibold text-primary-900 dark:text-primary-100">
              {sourceStandard?.standard_name || sourceStandard?.name || 'Unknown'}
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {students.slice(0, 10).map((student, idx) => (
              <div key={idx} className="text-sm text-primary-800 dark:text-primary-200">
                • {student.full_name} ({student.roll_number})
              </div>
            ))}
            {students.length > 10 && (
              <div className="text-sm text-primary-700 dark:text-primary-300 italic">
                ... and {students.length - 10} more
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-3">
            Total Pending Dues
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-amber-700 dark:text-amber-300">Fee Dues</div>
              <div className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                {formatINR(totals.totalFeeDues)}
              </div>
            </div>
            <div>
              <div className="text-amber-700 dark:text-amber-300">Negative Pocket Money</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatINR(Math.abs(totals.totalNegativePocketMoney))}
              </div>
            </div>
            <div>
              <div className="text-amber-700 dark:text-amber-300">Total Pending</div>
              <div className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                {formatINR(totals.totalDues)}
              </div>
            </div>
          </div>
        </div>

        {/* Batch Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Batch Name (Optional)
          </label>
          <input
            type="text"
            value={formData.batchName}
            onChange={(e) => handleChange('batchName', e.target.value)}
            placeholder="e.g., Class 5 to Class 6 Promotion 2024"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
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
                disabled={!nextStandard}
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">Promoted</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Move all students to next standard
                  {!nextStandard && ' (Not available - no next standard)'}
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
                  All students stay in same standard
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
                  Students completed final year and graduated
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Target Standard */}
        {formData.promotionStatus === 'promoted' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Target Standard *
            </label>
            {nextStandard ? (
              <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {nextStandard.standard_name || nextStandard.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Auto-selected based on source standard
                    </div>
                  </div>
                  <div className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                    Next Standard
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full px-3 py-2 border border-amber-300 dark:border-amber-600 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                  <div>
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      No Next Standard Available
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                      Students are in final year. Consider using "Graduated" status instead.
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        {/* Dues Handling */}
        {totals.totalDues > 0 && (
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
                    All dues will be tracked and carried to next year
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
                  <div className="font-medium text-slate-900 dark:text-slate-100">Waive All Dues</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Forgive all pending dues for all students (requires approval)
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

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
            {isSubmitting ? 'Processing...' : `Promote ${students.length} Students`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default BulkPromotionModal
