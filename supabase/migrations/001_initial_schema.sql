-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- User profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'finance', 'staff')),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT
);

-- School profile table (single row)
CREATE TABLE public.school_profile (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  school_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  pin_code TEXT,
  phone TEXT,
  email TEXT,
  board_affiliation TEXT CHECK (board_affiliation IN ('CBSE','ICSE','SSC','HSSC','CBSE_Affiliated','State_Board','Other')),
  udise_code TEXT,
  trust_name TEXT,
  logo_storage_path TEXT,
  academic_year_start_month INTEGER NOT NULL DEFAULT 6,
  financial_year_start_month INTEGER NOT NULL DEFAULT 4,
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  high_value_approval_threshold_paise BIGINT NOT NULL DEFAULT 1000000,
  pocket_money_daily_debit_limit_paise BIGINT NOT NULL DEFAULT 50000,
  notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notification_channel TEXT CHECK (notification_channel IN ('sms','whatsapp','both','none')) DEFAULT 'none',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Academic years table
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_label TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Only one current year allowed
CREATE UNIQUE INDEX idx_one_current_year ON academic_years (is_current) WHERE is_current = TRUE;

-- Standards table (pre-seeded)
CREATE TABLE public.standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE
);

-- Fee configurations table
CREATE TABLE public.fee_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE RESTRICT,
  gender TEXT NOT NULL CHECK (gender IN ('male','female','other','all')),
  annual_fee_paise BIGINT NOT NULL CHECK (annual_fee_paise >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (academic_year_id, standard_id, gender)
);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  standard_id UUID REFERENCES standards(id) ON DELETE RESTRICT,
  roll_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  guardian_name TEXT,
  phone TEXT,
  alt_phone TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male','female','other')),
  dob DATE,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended','alumni','withdrawn')),
  admission_date DATE,
  photo_storage_path TEXT,
  aadhaar_last4 TEXT CHECK (aadhaar_last4 ~ '^\d{4}$'),
  annual_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (annual_fee_paise >= 0),
  fee_paid_paise BIGINT NOT NULL DEFAULT 0 CHECK (fee_paid_paise >= 0),
  pocket_money_paise BIGINT NOT NULL DEFAULT 0,
  is_rte BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  deletion_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (roll_number, academic_year_id)
);

-- Fee payments table
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','cheque','upi','bank_transfer','dd','neft','rtgs')),
  reference_number TEXT,
  bank_name TEXT,
  is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_payment_id UUID REFERENCES fee_payments(id),
  reversal_reason TEXT,
  reversed_by UUID REFERENCES auth.users(id),
  reversed_at TIMESTAMPTZ,
  receipt_number TEXT UNIQUE,
  receipt_file_path TEXT,
  notes TEXT,
  received_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male','female','other')),
  dob DATE,
  phone TEXT,
  alt_phone TEXT,
  email TEXT,
  address TEXT,
  qualification TEXT,
  subjects TEXT[],
  designation TEXT,
  joining_date DATE NOT NULL,
  leaving_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resigned','terminated','on_leave')),
  monthly_salary_paise BIGINT NOT NULL DEFAULT 0 CHECK (monthly_salary_paise >= 0),
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  pan_last4 TEXT CHECK (pan_last4 ~ '^[A-Z0-9]{4}$'),
  pf_uan TEXT,
  photo_storage_path TEXT,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  deletion_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'construction_repair','utilities','stationery','cleaning_sanitation',
    'security','transport','events_programs','government_fees',
    'staff_welfare','medical_firstaid','library','technology',
    'sports_equipment','bank_charges','audit_fees','legal_fees','miscellaneous'
  )),
  sub_category TEXT,
  description TEXT NOT NULL CHECK (char_length(description) >= 5),
  vendor_name TEXT,
  vendor_phone TEXT,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  type TEXT NOT NULL CHECK (type IN ('debit','refund')),
  original_expense_id UUID REFERENCES expenses(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','cheque','upi','bank_transfer','dd','neft','rtgs')),
  reference_number TEXT,
  bill_number TEXT,
  bill_storage_path TEXT,
  needs_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  deletion_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'CREATE','UPDATE','DELETE','SOFT_DELETE','RESTORE',
    'REVERSE','LOGIN','LOGOUT','EXPORT','BULK_OPERATION',
    'APPROVAL','REJECTION','CORRECTION','VIEW_SENSITIVE'
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'student','teacher','fee_payment','fee_config','expense',
    'inventory','salary_payment','salary_advance','pocket_money',
    'user','school_profile','academic_year','report'
  )),
  entity_id TEXT,
  entity_label TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performer_name TEXT NOT NULL,
  performer_role TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  old_value JSONB,
  new_value JSONB,
  changed_fields TEXT[],
  description TEXT NOT NULL,
  session_id TEXT,
  academic_year_id UUID REFERENCES academic_years(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System alerts table
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'no_fee_config','negative_inventory','negative_pocket_money',
    'salary_overdue','report_generation_failed','high_value_unapproved',
    'student_withdrawal_pending_fee','advance_overdue','backup_reminder'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_id_text TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_students_year_standard ON students (academic_year_id, standard_id);
CREATE INDEX idx_students_status ON students (status, is_deleted);
CREATE INDEX idx_students_name ON students USING gin (to_tsvector('english', full_name));
CREATE INDEX idx_fp_student_year ON fee_payments (student_id, academic_year_id);
CREATE INDEX idx_fp_date ON fee_payments (payment_date);
CREATE INDEX idx_expenses_date_year ON expenses (expense_date, academic_year_id);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs (performed_by, created_at DESC);
CREATE INDEX idx_audit_date ON audit_logs (created_at DESC);

-- Insert default school profile
INSERT INTO school_profile (school_name, academic_year_start_month, financial_year_start_month) 
VALUES ('Demo School', 6, 4);

-- Insert standards
INSERT INTO standards (id, name, sort_order) VALUES
  (uuid_generate_v4(), 'Nursery', 1),
  (uuid_generate_v4(), 'LKG', 2),
  (uuid_generate_v4(), 'UKG', 3),
  (uuid_generate_v4(), 'I', 4),
  (uuid_generate_v4(), 'II', 5),
  (uuid_generate_v4(), 'III', 6),
  (uuid_generate_v4(), 'IV', 7),
  (uuid_generate_v4(), 'V', 8),
  (uuid_generate_v4(), 'VI', 9),
  (uuid_generate_v4(), 'VII', 10),
  (uuid_generate_v4(), 'VIII', 11),
  (uuid_generate_v4(), 'IX', 12),
  (uuid_generate_v4(), 'X', 13),
  (uuid_generate_v4(), 'XI', 14),
  (uuid_generate_v4(), 'XII', 15);

-- Insert current academic year
INSERT INTO academic_years (year_label, start_date, end_date, is_current) 
VALUES ('2024-25', '2024-06-01', '2025-05-31', true);