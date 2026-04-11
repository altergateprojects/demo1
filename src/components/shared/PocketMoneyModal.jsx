import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRecordPocketMoneyTransaction } from '../../hooks/usePocketMoney'
import { formatINR } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'

// Predefined debit categories
const DEBIT_CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'forms', label: 'Forms' },
  { value: 'sports', label: 'Sports' },
  { value: 'haircut', label: 'Hair Cut' },
  { value: 'festival', label: 'Festival Fee' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'books', label: 'Books' },
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food/Lunch' },
  { value: 'other', label: 'Other' }
]

const pocketMoneySchema = z.object({
  amount_paise: z.number().min(100, 'Minimum amount is ₹1'),
  transaction_type: z.enum(['credit', 'debit']),
  debit_category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.string().optional()
}).refine((data) => {
  // If debit and category is "other", notes must be provided
  if (data.transaction_type === 'debit' && data.debit_category === 'other') {
    return data.notes && data.notes.trim().length > 0
  }
  return true
}, {
  message: 'Notes are required when "Other" category is selected',
  path: ['notes']
})

const PocketMoneyModal = ({ 
  isOpen, 
  onClose, 
  student,
  type = 'credit' // 'credit' or 'debit'
}) => {
  const recordTransactionMutation = useRecordPocketMoneyTransaction()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm({
    resolver: zodResolver(pocketMoneySchema),
    defaultValues: {
      transaction_type: type,
      amount_paise: 0,
      debit_category: '',
      description: type === 'credit' ? 'Pocket money credit' : '',
      transaction_date: new Date().toISOString().split('T')[0]
    }
  })

  const watchedAmount = watch('amount_paise')
  const transactionType = watch('transaction_type')
  const debitCategory = watch('debit_category')

  const onSubmit = async (data) => {
    try {
      // Build description from category if debit
      let finalDescription = data.description
      if (data.transaction_type === 'debit' && data.debit_category) {
        const category = DEBIT_CATEGORIES.find(c => c.value === data.debit_category)
        finalDescription = category ? category.label : data.description
      }

      // Remove debit_category before sending to API (it's not a database column)
      const { debit_category, ...transactionData } = data

      // Build clean transaction object without debit_category
      const cleanTransaction = {
        amount_paise: transactionData.amount_paise,
        transaction_type: transactionData.transaction_type,
        description: finalDescription,
        notes: transactionData.notes,
        transaction_date: transactionData.transaction_date,
        student_id: student.id
      }

      await recordTransactionMutation.mutateAsync(cleanTransaction)
      reset()
      onClose()
    } catch (error) {
      console.error('Error recording pocket money transaction:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!student) return null

  const maxDebit = student.pocket_money_paise || 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${type === 'credit' ? 'Add Credit' : 'Record Debit'} - Pocket Money`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            {student.full_name} - {student.standards?.name} ({student.roll_number})
          </h3>
          <div className="text-sm">
            <span className="text-slate-600 dark:text-slate-400">Current Balance:</span>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {formatINR(student.pocket_money_paise)}
            </div>
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Transaction Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="credit"
                {...register('transaction_type')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Add Credit</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="debit"
                {...register('transaction_type')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Record Debit</span>
            </label>
          </div>
        </div>

        {/* Amount */}
        <CurrencyInput
          label="Amount"
          required
          value={watchedAmount}
          onChange={(value) => setValue('amount_paise', value)}
          error={errors.amount_paise?.message}
          helperText={transactionType === 'debit' ? `Current balance: ${formatINR(maxDebit)}` : undefined}
        />

        {/* Transaction Date */}
        <Input
          label="Transaction Date"
          type="date"
          {...register('transaction_date')}
          error={errors.transaction_date?.message}
        />

        {/* Debit Category (only for debit transactions) */}
        {transactionType === 'debit' && (
          <Select
            label="Category"
            required
            placeholder="Select debit category"
            options={DEBIT_CATEGORIES}
            {...register('debit_category')}
            error={errors.debit_category?.message}
          />
        )}

        {/* Description */}
        <Input
          label={transactionType === 'debit' ? 'Additional Description (Optional)' : 'Description (Optional)'}
          placeholder={transactionType === 'credit' ? 'e.g., Monthly allowance' : 'e.g., Additional details'}
          {...register('description')}
          error={errors.description?.message}
        />

        {/* Notes - Required when "Other" is selected */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes {transactionType === 'debit' && debitCategory === 'other' && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <textarea
            rows={3}
            className={`input-field ${errors.notes ? 'border-red-300 dark:border-red-600' : ''}`}
            placeholder={
              transactionType === 'debit' && debitCategory === 'other'
                ? 'Please specify the reason for debit (required)'
                : 'Any additional notes about this transaction'
            }
            {...register('notes')}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.notes.message}
            </p>
          )}
          {transactionType === 'debit' && debitCategory === 'other' && (
            <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
              Notes are required when "Other" category is selected
            </p>
          )}
        </div>

        {/* Overdraft Warning */}
        {transactionType === 'debit' && watchedAmount > maxDebit && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Overdraft Transaction
                </h3>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  This will create an overdraft of {formatINR(watchedAmount - maxDebit)}. Student will owe money.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Preview */}
        {watchedAmount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Balance After Transaction
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              New balance will be: {formatINR(
                transactionType === 'credit' 
                  ? student.pocket_money_paise + watchedAmount
                  : student.pocket_money_paise - watchedAmount
              )}
              {transactionType === 'debit' && (student.pocket_money_paise - watchedAmount) < 0 && (
                <span className="text-orange-600 dark:text-orange-400 font-medium"> (Overdraft)</span>
              )}
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={recordTransactionMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={recordTransactionMutation.isLoading}
            disabled={watchedAmount <= 0}
          >
            {transactionType === 'credit' ? 'Add Credit' : 'Record Debit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default PocketMoneyModal