// Indian Standards (Pre-seeded data)
export const STANDARDS = [
  { id: 'nursery', name: 'Nursery', sort_order: 1 },
  { id: 'lkg', name: 'LKG', sort_order: 2 },
  { id: 'ukg', name: 'UKG', sort_order: 3 },
  { id: 'class-1', name: 'I', sort_order: 4 },
  { id: 'class-2', name: 'II', sort_order: 5 },
  { id: 'class-3', name: 'III', sort_order: 6 },
  { id: 'class-4', name: 'IV', sort_order: 7 },
  { id: 'class-5', name: 'V', sort_order: 8 },
  { id: 'class-6', name: 'VI', sort_order: 9 },
  { id: 'class-7', name: 'VII', sort_order: 10 },
  { id: 'class-8', name: 'VIII', sort_order: 11 },
  { id: 'class-9', name: 'IX', sort_order: 12 },
  { id: 'class-10', name: 'X', sort_order: 13 },
  { id: 'class-11', name: 'XI', sort_order: 14 },
  { id: 'class-12', name: 'XII', sort_order: 15 }
]

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

// Board Affiliations
export const BOARD_AFFILIATIONS = [
  'CBSE', 'ICSE', 'SSC', 'HSSC', 'CBSE_Affiliated', 'State_Board', 'Other'
]

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'dd', label: 'Demand Draft' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' }
]

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { value: 'construction_repair', label: 'Construction & Repair' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'cleaning_sanitation', label: 'Cleaning & Sanitation' },
  { value: 'security', label: 'Security' },
  { value: 'transport', label: 'Transport' },
  { value: 'events_programs', label: 'Events & Programs' },
  { value: 'government_fees', label: 'Government Fees' },
  { value: 'staff_welfare', label: 'Staff Welfare' },
  { value: 'medical_firstaid', label: 'Medical & First Aid' },
  { value: 'library', label: 'Library' },
  { value: 'technology', label: 'Technology' },
  { value: 'sports_equipment', label: 'Sports Equipment' },
  { value: 'bank_charges', label: 'Bank Charges' },
  { value: 'audit_fees', label: 'Audit Fees' },
  { value: 'legal_fees', label: 'Legal Fees' },
  { value: 'miscellaneous', label: 'Miscellaneous' }
]

// Inventory Categories
export const INVENTORY_CATEGORIES = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'sports', label: 'Sports' },
  { value: 'books', label: 'Books' },
  { value: 'lab_equipment', label: 'Lab Equipment' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'building', label: 'Building' },
  { value: 'misc', label: 'Miscellaneous' }
]

// User Roles
export const USER_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'finance', label: 'Finance Staff' },
  { value: 'staff', label: 'Staff' }
]

// Student Status
export const STUDENT_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'withdrawn', label: 'Withdrawn' }
]

// Teacher Status
export const TEACHER_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'on_leave', label: 'On Leave' }
]

// Academic Year Logic (June to May)
export const ACADEMIC_YEAR_START_MONTH = 6 // June
export const ACADEMIC_YEAR_END_MONTH = 5 // May

// Default Thresholds
export const DEFAULT_HIGH_VALUE_THRESHOLD = 1000000 // ₹10,000 in paise
export const DEFAULT_POCKET_MONEY_LIMIT = 50000 // ₹500 in paise