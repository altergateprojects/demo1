import React, { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { downloadStudentDataPDF } from '../../lib/pdfGenerator'
import { getCompleteStudentData, deleteStudentCompletely } from '../../api/students.api'
import { recordStudentExitWithDues } from '../../api/studentDues.api'
import { formatINR } from '../../lib/formatters'
import toast from 'react-hot-toast'

const DeleteStudentModal = ({ 
  isOpen, 
  onClose, 
  student,
  onDeleteSuccess 
}) => {
  const [step, setStep] = useState(1) // 1: Dues Check, 2: PDF Download, 3: Final Confirmation
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMovingToDues, setIsMovingToDues] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [exitReason, setExitReason] = useState('')
  const [exitNotes, setExitNotes] = useState('')

  // Calculate outstanding amounts
  const currentYearPending = Math.max(0, (student?.annual_fee_paise || 0) - (student?.fee_paid_paise || 0))
  const previousYearsPending = student?.previous_years_pending_paise || 0
  const totalPending = currentYearPending + previousYearsPending
  const negativePocketMoney = Math.min(0, student?.pocket_money_paise || 0)
  
  const hasOutstandingDues = totalPending > 0 || negativePocketMoney < 0

  // Ensure step is always valid
  const currentStep = [1, 2, 3].includes(step) ? step : 1

  // Debug logging
  useEffect(() => {
    if (student && isOpen) {
      console.log('DeleteStudentModal - Student data:', student)
      console.log('DeleteStudentModal - Dues calculation:', {
        currentYearPending,
        previousYearsPending,
        totalPending,
        negativePocketMoney,
        hasOutstandingDues,
        step
      })
    }
  }, [student, isOpen, currentYearPending, previousYearsPending, totalPending, negativePocketMoney, hasOutstandingDues, step])

  const requiredConfirmText = `DELETE ${student?.roll_number}`

  const handleClose = () => {
    setStep(1)
    setPdfGenerated(false)
    setDeletionReason('')
    setConfirmText('')
    setExitReason('')
    setExitNotes('')
    setIsGeneratingPDF(false)
    setIsDeleting(false)
    setIsMovingToDues(false)
    onClose()
  }

  // Reset modal state when it opens or when student changes
  useEffect(() => {
    if (isOpen && student) {
      console.log('DeleteStudentModal - Resetting state for student:', student.full_name)
      setStep(1)
      setPdfGenerated(false)
      setDeletionReason('')
      setConfirmText('')
      setExitReason('')
      setExitNotes('')
      setIsGeneratingPDF(false)
      setIsDeleting(false)
      setIsMovingToDues(false)
    }
  }, [isOpen, student?.id]) // Reset when modal opens or student changes

  const handleMoveToStudentDues = async () => {
    if (!student || !exitReason.trim()) return

    setIsMovingToDues(true)
    try {
      console.log('Moving student to dues:', {
        studentId: student.id,
        exitReason: exitReason.trim(),
        exitDate: new Date().toISOString().split('T')[0],
        notes: exitNotes.trim() || null
      })

      const result = await recordStudentExitWithDues({
        studentId: student.id,
        exitReason: exitReason.trim(),
        exitDate: new Date().toISOString().split('T')[0],
        notes: exitNotes.trim() || null
      })
      
      console.log('Student exit result:', result)
      toast.success('Student moved to Student Dues section successfully!')
      onDeleteSuccess?.() // This will refresh the students list
      handleClose()
    } catch (error) {
      console.error('Error moving student to dues:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to move student to dues. '
      if (error.message?.includes('not found')) {
        errorMessage += 'Student not found in database.'
      } else if (error.message?.includes('permission')) {
        errorMessage += 'You do not have permission to perform this action.'
      } else if (error.message?.includes('function')) {
        errorMessage += 'Database function not available. Please contact administrator.'
      } else if (error.message?.includes('check constraint') || error.message?.includes('exit_reason')) {
        errorMessage += 'Invalid exit reason selected. Please try a different reason or contact administrator.'
      } else if (error.message?.includes('violates')) {
        errorMessage += 'Database constraint violation. Please contact administrator to fix the database setup.'
      } else {
        errorMessage += error.message || 'Please try again.'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsMovingToDues(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!student) return

    setIsGeneratingPDF(true)
    try {
      console.log('Starting PDF generation for student:', student.id)
      
      // Get complete student data
      const completeData = await getCompleteStudentData(student.id)
      console.log('Complete data fetched:', completeData)
      
      if (!completeData || !completeData.student) {
        throw new Error('Student data not found or incomplete')
      }
      
      // Generate and download PDF
      const filename = `student_data_${student.roll_number}_${student.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`
      console.log('Generating PDF with filename:', filename)
      
      await downloadStudentDataPDF(completeData, filename)
      
      setPdfGenerated(true)
      toast.success('Student data PDF downloaded successfully!')
      setStep(3) // Move to final confirmation
    } catch (error) {
      console.error('Error generating PDF:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to generate PDF. '
      if (error.message?.includes('not found')) {
        errorMessage += 'Student data could not be retrieved.'
      } else if (error.message?.includes('incomplete')) {
        errorMessage += 'Student data is incomplete.'
      } else if (error.message?.includes('PDF')) {
        errorMessage += 'PDF generation failed.'
      } else {
        errorMessage += error.message || 'Please try again.'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleFinalDelete = async () => {
    if (!student || confirmText !== requiredConfirmText) return

    setIsDeleting(true)
    try {
      await deleteStudentCompletely(student.id, deletionReason)
      toast.success('Student deleted successfully!')
      onDeleteSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Error deleting student:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to delete student. '
      if (error.message?.includes('not found')) {
        errorMessage += 'Student not found in database.'
      } else if (error.message?.includes('foreign key')) {
        errorMessage += 'Cannot delete: student has related records that prevent deletion.'
      } else if (error.message?.includes('permission')) {
        errorMessage += 'You do not have permission to delete students.'
      } else if (error.message?.includes('function not found')) {
        errorMessage += 'Database function missing. Please contact administrator.'
      } else if (error.message?.includes('Database error:')) {
        errorMessage += error.message
      } else {
        errorMessage += error.message || 'Please try again or contact administrator.'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!student) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === 1 ? "Delete Student - Outstanding Dues Check" :
        currentStep === 2 ? "Delete Student - Download Data Backup" :
        "Delete Student - Final Confirmation"
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
            Debug: Step {currentStep}, Student: {student?.full_name}, HasDues: {hasOutstandingDues ? 'Yes' : 'No'}
          </div>
        )}
        
        {/* Step 1: Outstanding Dues Check */}
        {currentStep === 1 && (
          <>
            {hasOutstandingDues ? (
              <>
                {/* Outstanding Dues Warning */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        OUTSTANDING DUES DETECTED
                      </h3>
                      <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                        <p><strong>{student.full_name}</strong> (Roll: {student.roll_number}) has outstanding dues:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {currentYearPending > 0 && (
                            <li>Current Year Pending Fees: <strong>{formatINR(currentYearPending)}</strong></li>
                          )}
                          {previousYearsPending > 0 && (
                            <li>Previous Years Pending Fees: <strong>{formatINR(previousYearsPending)}</strong></li>
                          )}
                          {negativePocketMoney < 0 && (
                            <li>Negative Pocket Money Balance: <strong>{formatINR(negativePocketMoney)}</strong></li>
                          )}
                          <li className="font-semibold">Total Outstanding: <strong>{formatINR(totalPending + Math.abs(negativePocketMoney))}</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        RECOMMENDED: Move to Student Dues
                      </h3>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        Instead of permanent deletion, move this student to the <strong>Student Dues</strong> section. 
                        This preserves their record for debt collection while removing them from the active student list.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Exit Reason Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Exit *
                    </label>
                    <select
                      className="input-field"
                      value={exitReason}
                      onChange={(e) => setExitReason(e.target.value)}
                    >
                      <option value="">Select exit reason...</option>
                      <option value="Transfer to another school">Transfer to another school</option>
                      <option value="Discontinued studies">Discontinued studies</option>
                      <option value="Financial difficulties">Financial difficulties</option>
                      <option value="Family relocation">Family relocation</option>
                      <option value="Academic reasons">Academic reasons</option>
                      <option value="Disciplinary action">Disciplinary action</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      rows={3}
                      className="input-field"
                      placeholder="Any additional information about the student's exit..."
                      value={exitNotes}
                      onChange={(e) => setExitNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleMoveToStudentDues}
                    loading={isMovingToDues}
                    disabled={!exitReason.trim()}
                  >
                    📋 Move to Student Dues
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setStep(2)}
                  >
                    🗑️ Delete Permanently Anyway
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* No Outstanding Dues */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        NO OUTSTANDING DUES
                      </h3>
                      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                        <strong>{student.full_name}</strong> (Roll: {student.roll_number}) has no pending fees or negative pocket money balance.
                        You can proceed with permanent deletion.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deletion Warning */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        PERMANENT DELETION WARNING
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>This will permanently delete:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All fee payment records</li>
                          <li>All student dues and transactions</li>
                          <li>All pocket money history</li>
                          <li>All academic year snapshots</li>
                          <li>All audit logs related to this student</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setStep(2)}
                  >
                    Continue to Deletion
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 2: PDF Download */}
        {currentStep === 2 && (
          <>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">
                Download Student Data Backup
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Generate and download a complete PDF report of all student data before deletion.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                PDF will include:
              </h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Complete student information and contact details</li>
                <li>• Financial summary (fees, payments, balances)</li>
                <li>• All fee payment history with receipts</li>
                <li>• Student dues and transaction records</li>
                <li>• Pocket money transaction history</li>
                <li>• Academic year snapshots and promotion history</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={isGeneratingPDF}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleGeneratePDF}
                loading={isGeneratingPDF}
                disabled={pdfGenerated}
              >
                {pdfGenerated ? 'PDF Downloaded ✓' : 'Generate & Download PDF'}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Final Confirmation */}
        {currentStep === 3 && (
          <>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    FINAL CONFIRMATION REQUIRED
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    This action cannot be undone. The student and all related data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Deletion *
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Enter the reason for deleting this student (required for audit trail)"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type "{requiredConfirmText}" to confirm *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Type ${requiredConfirmText} to confirm deletion`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(2)}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleFinalDelete}
                loading={isDeleting}
                disabled={!deletionReason.trim() || confirmText !== requiredConfirmText}
              >
                DELETE STUDENT PERMANENTLY
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default DeleteStudentModal