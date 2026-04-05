import { z } from 'zod'
import { parsePhoneNumber } from 'libphonenumber-js'

// Common validation schemas
export const phoneSchema = z.string()
  .optional()
  .refine((phone) => {
    if (!phone) return true
    try {
      const parsed = parsePhoneNumber(phone, 'IN')
      return parsed.isValid() && parsed.getType() === 'MOBILE'
    } catch {
      return false
    }
  }, 'Please enter a valid Indian mobile number')

export const aadhaarLast4Schema = z.string()
  .optional()
  .refine((val) => !val || /^\d{4}$/.test(val), 'Last 4 digits of Aadhaar must be exactly 4 digits')

export const panLast4Schema = z.string()
  .optional()
  .refine((val) => !val || /^[A-Z0-9]{4}$/.test(val), 'Last 4 characters of PAN must be alphanumeric')

export const amountSchema = z.number()
  .min(0, 'Amount must be positive')
  .max(999999999, 'Amount too large')

// User Profile Schema
export const userProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'finance', 'staff']),
  phone: phoneSchema,
  is_active: z.boolean().default(true)
})

// School Profile Schema
export const schoolProfileSchema = z.object({
  school_name: z.string().min(2, 'School name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pin_code: z.string().optional().refine((val) => !val || /^\d{6}$/.test(val), 'PIN code must be 6 digits'),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  board_affiliation: z.enum(['CBSE','ICSE','SSC','HSSC','CBSE_Affiliated','State_Board','Other']).optional(),
  udise_code: z.string().optional(),
  trust_name: z.string().optional()
})

// Student Schema
export const studentSchema = z.object({
  roll_number: z.string().min(1, 'Roll number is required'),
  full_name: z.string().min(2, 'Full name is required'),
  guardian_name: z.string().optional(),
  phone: phoneSchema,
  alt_phone: phoneSchema,
  gender: z.enum(['male', 'female', 'other']),
  dob: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'alumni', 'withdrawn']).default('active'),
  admission_date: z.string().optional(),
  aadhaar_last4: aadhaarLast4Schema,
  is_rte: z.boolean().default(false),
  notes: z.string().optional(),
  standard_id: z.string().min(1, 'Standard is required'),
  academic_year_id: z.string().min(1, 'Academic year is required')
})

// Teacher Schema
export const teacherSchema = z.object({
  employee_code: z.string().min(1, 'Employee code is required'),
  full_name: z.string().min(2, 'Full name is required'),
  gender: z.enum(['male', 'female', 'other']),
  dob: z.string().optional(),
  phone: phoneSchema,
  alt_phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  qualification: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  designation: z.string().optional(),
  joining_date: z.string().min(1, 'Joining date is required'),
  leaving_date: z.string().optional(),
  status: z.enum(['active', 'resigned', 'terminated', 'on_leave']).default('active'),
  monthly_salary_paise: z.number().min(0, 'Salary must be positive'),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
  bank_name: z.string().optional(),
  pan_last4: panLast4Schema,
  pf_uan: z.string().optional(),
  notes: z.string().optional()
})

// Fee Payment Schema
export const feePaymentSchema = z.object({
  student_id: z.string().min(1, 'Student is required'),
  amount_paise: z.number().min(1, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['cash', 'cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs']),
  reference_number: z.string().optional(),
  bank_name: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => {
  // Reference number required for non-cash payments
  const requiresReference = ['cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs']
  if (requiresReference.includes(data.payment_method) && !data.reference_number) {
    return false
  }
  return true
}, {
  message: 'Reference number is required for this payment method',
  path: ['reference_number']
}).refine((data) => {
  // Bank name required for cheque and DD
  const requiresBank = ['cheque', 'dd']
  if (requiresBank.includes(data.payment_method) && !data.bank_name) {
    return false
  }
  return true
}, {
  message: 'Bank name is required for this payment method',
  path: ['bank_name']
})

// Expense Schema
export const expenseSchema = z.object({
  expense_date: z.string().min(1, 'Expense date is required'),
  category: z.enum([
    'construction_repair', 'utilities', 'stationery', 'cleaning_sanitation',
    'security', 'transport', 'events_programs', 'government_fees',
    'staff_welfare', 'medical_firstaid', 'library', 'technology',
    'sports_equipment', 'bank_charges', 'audit_fees', 'legal_fees', 'miscellaneous'
  ]),
  sub_category: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  vendor_name: z.string().optional(),
  vendor_phone: phoneSchema,
  amount_paise: z.number().min(1, 'Amount must be greater than 0'),
  type: z.enum(['debit', 'refund']).default('debit'),
  original_expense_id: z.string().optional(),
  payment_method: z.enum(['cash', 'cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs']),
  reference_number: z.string().optional(),
  bill_number: z.string().optional(),
  notes: z.string().optional(),
  academic_year_id: z.string().min(1, 'Academic year is required')
}).refine((data) => {
  // Miscellaneous category requires detailed description
  if (data.category === 'miscellaneous' && data.description.length < 20) {
    return false
  }
  return true
}, {
  message: 'Miscellaneous expenses require detailed description (minimum 20 characters)',
  path: ['description']
}).refine((data) => {
  // Refund type requires original expense
  if (data.type === 'refund' && !data.original_expense_id) {
    return false
  }
  return true
}, {
  message: 'Original expense is required for refunds',
  path: ['original_expense_id']
})

// Pocket Money Schema
export const pocketMoneySchema = z.object({
  student_id: z.string().min(1, 'Student is required'),
  type: z.enum(['credit', 'debit', 'adjustment', 'opening_balance', 'closing_balance']),
  amount_paise: z.number().min(1, 'Amount must be greater than 0'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  category: z.enum([
    'allowance', 'guardian_deposit', 'canteen', 'stationery', 
    'event_fee', 'advance', 'correction', 'other'
  ]).optional(),
  approved_by: z.string().optional()
}).refine((data) => {
  // Adjustment and correction types require approval
  const requiresApproval = ['adjustment', 'correction']
  if (requiresApproval.includes(data.type) && !data.approved_by) {
    return false
  }
  return true
}, {
  message: 'Approval is required for adjustments and corrections',
  path: ['approved_by']
})

// Inventory Schema
export const inventorySchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  category: z.enum(['furniture', 'electronics', 'sports', 'books', 'lab_equipment', 'vehicle', 'building', 'misc']),
  action: z.enum(['purchase', 'disposal', 'damage_write_off', 'stock_correction', 'transfer_in', 'transfer_out', 'donation_received']),
  quantity_delta: z.number().refine((val) => val !== 0, 'Quantity change cannot be zero'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price_paise: z.number().min(0, 'Unit price must be positive').optional(),
  supplier_name: z.string().optional(),
  supplier_invoice: z.string().optional(),
  location: z.string().optional(),
  condition: z.enum(['new', 'good', 'fair', 'poor', 'damaged']).optional(),
  recovery_amount_paise: z.number().min(0, 'Recovery amount must be positive').optional(),
  notes: z.string().optional(),
  log_date: z.string().min(1, 'Date is required'),
  academic_year_id: z.string().optional()
}).refine((data) => {
  // Purchase requires supplier info and unit price
  if (data.action === 'purchase' && (!data.supplier_name || !data.unit_price_paise)) {
    return false
  }
  return true
}, {
  message: 'Purchase requires supplier name and unit price',
  path: ['supplier_name']
}).refine((data) => {
  // Stock correction requires detailed notes
  if (data.action === 'stock_correction' && (!data.notes || data.notes.length < 20)) {
    return false
  }
  return true
}, {
  message: 'Stock corrections require detailed notes (minimum 20 characters)',
  path: ['notes']
})

// Salary Payment Schema
export const salaryPaymentSchema = z.object({
  teacher_id: z.string().min(1, 'Teacher is required'),
  salary_month: z.number().min(1).max(12),
  salary_year: z.number().min(2000).max(2100),
  gross_paise: z.number().min(0, 'Gross salary must be positive'),
  deductions_paise: z.number().min(0, 'Deductions must be positive'),
  net_paise: z.number().min(0, 'Net salary must be positive'),
  deduction_breakdown: z.record(z.number()).optional(),
  advance_adjusted_paise: z.number().min(0, 'Advance adjustment must be positive').default(0),
  payment_date: z.string().optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'upi', 'neft', 'rtgs']).optional(),
  reference_number: z.string().optional(),
  is_paid: z.boolean().default(false),
  notes: z.string().optional()
})

// Academic Year Schema
export const academicYearSchema = z.object({
  year_label: z.string().min(1, 'Year label is required').regex(/^\d{4}-\d{2}$/, 'Year label must be in format YYYY-YY'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  is_current: z.boolean().default(false)
}).refine((data) => {
  // End date must be after start date
  if (new Date(data.end_date) <= new Date(data.start_date)) {
    return false
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['end_date']
})

// Fee Configuration Schema
export const feeConfigurationSchema = z.object({
  academic_year_id: z.string().min(1, 'Academic year is required'),
  standard_id: z.string().min(1, 'Standard is required'),
  gender: z.enum(['male', 'female', 'other', 'all']),
  annual_fee_paise: z.number().min(0, 'Fee must be positive'),
  is_active: z.boolean().default(true),
  notes: z.string().optional()
})