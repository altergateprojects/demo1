import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateExpense } from '../../hooks/useExpenses'
import { useCurrentAcademicYear, useAcademicYears } from '../../hooks/useCommon'
import { EXPENSE_CATEGORIES } from '../../api/expenses.api'
import Modal from '../ui/Modal'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'
import FileUpload from '../ui/FileUpload'
import useAuthStore from '../../store/authStore'

// Helper function to determine academic year from expense date
const determineAcademicYearFromDate = async (expenseDate, academicYears) => {
  // Find the academic year that contains this expense date
  const matchingYear = academicYears.find(year => {
    const startDate = new Date(year.start_date)
    const endDate = new Date(year.end_date)
    return expenseDate >= startDate && expenseDate <= endDate
  })
  
  if (matchingYear) {
    return matchingYear.id
  }
  
  // If no match found, return the current year as fallback
  const currentYear = academicYears.find(y => y.is_current)
  return currentYear?.id || academicYears[0]?.id
}

const expenseSchema = z.object({
  expense_date: z.string().min(1, 'Expense date is required'),
  category: z.string().min(1, 'Category is required'),
  sub_category: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  vendor_name: z.string().min(1, 'Vendor name is required'),
  vendor_phone: z.string().optional(),
  amount_paise: z.number().min(100, 'Minimum amount is ₹1'),
  payment_method: z.enum(['cash', 'cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs']),
  reference_number: z.string().optional(),
  bill_number: z.string().min(1, 'Bill number is required for audit trail'),
  needs_approval: z.boolean().default(false),
  notes: z.string().optional(),
  change_reason: z.string().min(10, 'Detailed reason for this expense is required for audit trail (minimum 10 characters)')
})

const AddExpenseModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore()
  const { data: currentYear } = useCurrentAcademicYear()
  const { data: academicYears } = useAcademicYears()
  const createExpenseMutation = useCreateExpense()
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFraudWarning, setShowFraudWarning] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
      amount_paise: 0,
      payment_method: 'cash',
      needs_approval: false
    }
  })

  const watchedAmount = watch('amount_paise')
  const watchedCategory = watch('category')

  // Auto-set approval requirement based on amount
  React.useEffect(() => {
    const shouldNeedApproval = watchedAmount > 1000000 // ₹10,000+
    setValue('needs_approval', shouldNeedApproval)
  }, [watchedAmount, setValue])

  const onSubmit = async (data) => {
    // Validate file uploads
    if (uploadedFiles.length === 0) {
      alert('⚠️ At least one bill/receipt image is required for fraud prevention!')
      return
    }

    const confirmSubmit = window.confirm(
      '🔒 FRAUD-PROOF EXPENSE SYSTEM\n\n' +
      '⚠️ IMPORTANT NOTICE:\n' +
      '• This expense will be PERMANENTLY recorded\n' +
      '• Cannot be deleted, only edited with full audit trail\n' +
      '• All changes will be tracked and logged\n' +
      '• Files will be stored immutably\n' +
      '• Complete transparency for financial integrity\n\n' +
      'Are you sure you want to proceed?'
    )
    
    if (!confirmSubmit) return

    setIsSubmitting(true)
    try {
      // Get client IP and user agent for audit trail
      const clientIP = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown')

      // Determine academic year based on expense_date (not current year!)
      // This ensures expenses stay in the correct year even when current year changes
      const expenseDate = new Date(data.expense_date)
      const academicYearId = determineAcademicYearFromDate(expenseDate, academicYears || [])

      // Create expense with fraud-proof data structure
      const expenseData = {
        academic_year_id: academicYearId,
        expense_date: data.expense_date,
        category: data.category,
        sub_category: data.sub_category || null,
        description: data.description,
        vendor_name: data.vendor_name,
        vendor_phone: data.vendor_phone || null,
        amount_paise: data.amount_paise,
        type: 'debit',
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        bill_number: data.bill_number,
        needs_approval: data.needs_approval || false,
        notes: data.notes || null,
        recorded_by: user.id,
        
        // Fraud prevention fields
        created_ip: clientIP,
        created_user_agent: navigator.userAgent,
        
        // Audit trail
        change_reason: data.change_reason,
        attachments: uploadedFiles.map(file => ({
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_extension: file.name.split('.').pop(),
          storage_path: file.path,
          file_hash: file.hash,
          uploaded_by: user.id
        }))
      }

      console.log('Submitting fraud-proof expense data:', expenseData)

      await createExpenseMutation.mutateAsync(expenseData)
      
      alert('✅ Expense recorded successfully with complete audit trail!')
      
      reset()
      setUploadedFiles([])
      setShowFraudWarning(true)
      onClose()
    } catch (error) {
      console.error('Error creating expense:', error)
      alert(`Failed to create expense: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    reset()
    setUploadedFiles([])
    setShowFraudWarning(true)
    onClose()
  }

  const handleFilesUploaded = (files) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🔒 Add New Expense - Fraud-Proof System"
      size="xl"
    >
      {/* Fraud Prevention Notice */}
      {showFraudWarning && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                🔒 Fraud-Proof Expense System
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Permanent Record:</strong> Once submitted, this expense cannot be deleted</li>
                  <li><strong>Complete Audit Trail:</strong> All changes will be tracked and logged</li>
                  <li><strong>Mandatory Documentation:</strong> Bill/receipt images are required</li>
                  <li><strong>Data Integrity:</strong> SHA-256 hash verification for all data</li>
                  <li><strong>Zero Fraud Tolerance:</strong> Complete transparency for financial integrity</li>
                </ul>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowFraudWarning(false)}
                  className="text-sm text-red-800 dark:text-red-200 underline hover:no-underline"
                >
                  I understand and accept these terms
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expense Date
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              className={`input-field ${errors.expense_date ? 'border-red-300 dark:border-red-600' : ''}`}
              {...register('expense_date')}
            />
            {errors.expense_date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.expense_date.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              className={`input-field ${errors.category ? 'border-red-300 dark:border-red-600' : ''}`}
              {...register('category')}
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Sub Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sub Category
            </label>
            <input
              type="text"
              className={`input-field ${errors.sub_category ? 'border-red-300 dark:border-red-600' : ''}`}
              placeholder="Specific type within category"
              {...register('sub_category')}
            />
            {errors.sub_category && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.sub_category.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount
              <span className="text-red-500 ml-1">*</span>
              {watchedAmount > 1000000 && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Requires Approval
                </span>
              )}
            </label>
            <CurrencyInput
              value={watchedAmount}
              onChange={(value) => setValue('amount_paise', value)}
              error={errors.amount_paise?.message}
            />
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Vendor Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              className={`input-field ${errors.vendor_name ? 'border-red-300 dark:border-red-600' : ''}`}
              placeholder="Name of vendor/supplier"
              {...register('vendor_name')}
            />
            {errors.vendor_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.vendor_name.message}
              </p>
            )}
          </div>

          {/* Vendor Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Vendor Phone
            </label>
            <input
              type="tel"
              className={`input-field ${errors.vendor_phone ? 'border-red-300 dark:border-red-600' : ''}`}
              placeholder="Vendor contact number"
              {...register('vendor_phone')}
            />
            {errors.vendor_phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.vendor_phone.message}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              className={`input-field ${errors.payment_method ? 'border-red-300 dark:border-red-600' : ''}`}
              {...register('payment_method')}
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="dd">Demand Draft</option>
              <option value="neft">NEFT</option>
              <option value="rtgs">RTGS</option>
            </select>
            {errors.payment_method && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.payment_method.message}
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              className={`input-field ${errors.reference_number ? 'border-red-300 dark:border-red-600' : ''}`}
              placeholder="Transaction/Reference number"
              {...register('reference_number')}
            />
            {errors.reference_number && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.reference_number.message}
              </p>
            )}
          </div>

          {/* Bill Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bill Number
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              className={`input-field ${errors.bill_number ? 'border-red-300 dark:border-red-600' : ''}`}
              placeholder="Bill/Invoice number"
              {...register('bill_number')}
            />
            {errors.bill_number && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.bill_number.message}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            rows={3}
            className={`input-field ${errors.description ? 'border-red-300 dark:border-red-600' : ''}`}
            placeholder="Detailed description of the expense"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Change Reason - Audit Trail */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Reason for Expense (Audit Trail)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            rows={3}
            className={`input-field ${errors.change_reason ? 'border-red-300 dark:border-red-600' : ''}`}
            placeholder="Detailed explanation of why this expense is necessary (required for audit trail)"
            {...register('change_reason')}
          />
          {errors.change_reason && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.change_reason.message}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            This information will be permanently recorded in the audit trail for transparency and compliance.
          </p>
        </div>

        {/* File Upload - Mandatory */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Bill/Receipt Images
            <span className="text-red-500 ml-1">*</span>
          </label>
          <FileUpload
            onFilesUploaded={handleFilesUploaded}
            maxFiles={10}
            maxSize={10 * 1024 * 1024} // 10MB
            accept={{
              'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            }}
            disabled={isSubmitting}
            expenseId={null} // Will be set after expense creation
          />
          {uploadedFiles.length === 0 && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              At least one bill/receipt image is required for fraud prevention
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Upload clear images of bills, receipts, or invoices. Files will be stored permanently with SHA-256 hash verification.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Additional Notes
          </label>
          <textarea
            rows={2}
            className="input-field"
            placeholder="Any additional notes (optional)"
            {...register('notes')}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={uploadedFiles.length === 0 || showFraudWarning}
            className={uploadedFiles.length === 0 || showFraudWarning ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {showFraudWarning ? '⚠️ Accept Terms First' : 
             uploadedFiles.length === 0 ? '🔒 Upload Bills First' : 
             '🔒 Create Permanent Record'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddExpenseModal