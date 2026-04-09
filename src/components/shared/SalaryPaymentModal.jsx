import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateSalaryPayment } from '../../hooks/useTeacherSalary'
import { formatINR } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import CurrencyInput from '../ui/CurrencyInput'
import Button from '../ui/Button'
import Select from '../ui/Select'

const paymentSchema = z.object({
  payment_date: z.string().min(1, 'Payment date is required'),
  base_salary_paise: z.number().min(0, 'Base salary cannot be negative'),
  bonus_amount_paise: z.number().min(0).default(0),
  deduction_amount_paise: z.number().min(0).default(0),
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'upi', 'neft', 'rtgs', 'dd']),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  is_partial_payment: z.boolean().default(false)
})

const SalaryPaymentModal = ({ isOpen, onClose, teacher, month }) => {
  const createPaymentMutation = useCreateSalaryPayment()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      base_salary_paise: teacher?.current_salary_paise || 0,
      bonus_amount_paise: 0,
      deduction_amount_paise: 0,
      payment_method: 'bank_transfer',
      is_partial_payment: false
    }
  })

  // Watch all values for calculation
  const baseSalary = watch('base_salary_paise')
  const bonusAmount = watch('bonus_amount_paise')
  const deductionAmount = watch('deduction_amount_paise')
  const paymentMethod = watch('payment_method')
  const isPartialPayment = watch('is_partial_payment')

  // Calculate net salary
  const netSalary = baseSalary + bonusAmount - deductionAmount
  const expectedSalary = teacher?.current_salary_paise || 0
  const isPartial = netSalary < expectedSalary

  const onSubmit = async (data) => {
    try {
      await createPaymentMutation.mutateAsync({
        teacher_id: teacher.id,
        salary_month: month + '-01',
        base_salary_paise: baseSalary,
        bonus_amount_paise: bonusAmount,
        deduction_amount_paise: deductionAmount,
        total_amount_paise: netSalary,
        is_partial_payment: isPartial || isPartialPayment,
        ...data
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error recording payment:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!teacher) return null

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Salary Payment"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Teacher & Month Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                {teacher.full_name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {teacher.subject || 'Teacher'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Payment Month</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{monthLabel}</p>
            </div>
          </div>
        </div>

        {/* Payment Date & Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Payment Date"
            type="date"
            required
            {...register('payment_date')}
            error={errors.payment_date?.message}
          />

          <Select
            label="Payment Method"
            required
            {...register('payment_method')}
            error={errors.payment_method?.message}
            options={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'upi', label: 'UPI' },
              { value: 'neft', label: 'NEFT' },
              { value: 'rtgs', label: 'RTGS' },
              { value: 'dd', label: 'Demand Draft' }
            ]}
          />
        </div>

        {/* Reference Numbers */}
        {paymentMethod !== 'cash' && (
          <Input
            label="Reference Number"
            placeholder="Transaction ID, Cheque No., etc."
            {...register('reference_number')}
            error={errors.reference_number?.message}
          />
        )}

        {/* Base Salary */}
        <CurrencyInput
          label="Base Salary"
          required
          value={baseSalary}
          onChange={(value) => setValue('base_salary_paise', value)}
          error={errors.base_salary_paise?.message}
          helperText={`Current salary: ${formatINR(teacher.current_salary_paise || 0)}`}
        />

        {/* Bonus/Allowances */}
        <CurrencyInput
          label="Bonus/Allowances (Total)"
          value={bonusAmount}
          onChange={(value) => setValue('bonus_amount_paise', value)}
          error={errors.bonus_amount_paise?.message}
          helperText="Total of all allowances (HRA, DA, TA, etc.)"
        />

        {/* Deductions */}
        <CurrencyInput
          label="Deductions (Total)"
          value={deductionAmount}
          onChange={(value) => setValue('deduction_amount_paise', value)}
          error={errors.deduction_amount_paise?.message}
          helperText="Total of all deductions (PF, ESI, TDS, Loan, etc.)"
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="input-field"
            placeholder="Any additional notes about this payment"
            {...register('notes')}
          />
        </div>

        {/* Partial Payment Warning */}
        {isPartial && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.964-1.333-3.732 0L3.268 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Partial Payment Detected
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  You're paying {formatINR(netSalary)} out of {formatINR(expectedSalary)}. 
                  Remaining: {formatINR(expectedSalary - netSalary)}
                </p>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_partial_payment')}
                    className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-yellow-900 dark:text-yellow-100">
                    I confirm this is a partial payment (teacher will still show as pending)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className={`bg-gradient-to-br ${isPartial ? 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800' : 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'} border rounded-lg p-4`}>
          <h3 className={`text-sm font-medium ${isPartial ? 'text-yellow-900 dark:text-yellow-100' : 'text-green-900 dark:text-green-100'} mb-3`}>
            Payment Summary
          </h3>
          <div className="space-y-2 text-sm">
            {isPartial && (
              <div className={`flex justify-between ${isPartial ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
                <span>Expected Salary:</span>
                <span className="font-medium">{formatINR(expectedSalary)}</span>
              </div>
            )}
            <div className={`flex justify-between ${isPartial ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
              <span>Base Salary:</span>
              <span className="font-medium">{formatINR(baseSalary)}</span>
            </div>
            {bonusAmount > 0 && (
              <div className={`flex justify-between ${isPartial ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
                <span>Bonus/Allowances:</span>
                <span className="font-medium">+{formatINR(bonusAmount)}</span>
              </div>
            )}
            {deductionAmount > 0 && (
              <div className={`flex justify-between ${isPartial ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
                <span>Deductions:</span>
                <span className="font-medium">-{formatINR(deductionAmount)}</span>
              </div>
            )}
            <div className={`flex justify-between pt-2 border-t ${isPartial ? 'border-yellow-300 dark:border-yellow-700' : 'border-green-300 dark:border-green-700'}`}>
              <span className={`font-semibold ${isPartial ? 'text-yellow-900 dark:text-yellow-100' : 'text-green-900 dark:text-green-100'}`}>
                {isPartial ? 'Partial Payment:' : 'Net Salary:'}
              </span>
              <span className={`font-bold text-lg ${isPartial ? 'text-yellow-900 dark:text-yellow-100' : 'text-green-900 dark:text-green-100'}`}>
                {formatINR(netSalary)}
              </span>
            </div>
            {isPartial && (
              <div className="flex justify-between text-yellow-600 dark:text-yellow-400 text-xs">
                <span>Remaining:</span>
                <span className="font-medium">{formatINR(expectedSalary - netSalary)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createPaymentMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createPaymentMutation.isLoading}
            disabled={netSalary <= 0 || (isPartial && !isPartialPayment)}
          >
            {isPartial && !isPartialPayment ? 'Confirm Partial Payment Above' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SalaryPaymentModal
