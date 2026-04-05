-- COMPLETE SUPABASE SETUP SCRIPT
-- Run this entire script in your Supabase SQL Editor

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

-- Create indexes
CREATE INDEX idx_students_year_standard ON students (academic_year_id, standard_id);
CREATE INDEX idx_students_status ON students (status, is_deleted);
CREATE INDEX idx_students_name ON students USING gin (to_tsvector('english', full_name));
CREATE INDEX idx_fp_student_year ON fee_payments (student_id, academic_year_id);
CREATE INDEX idx_fp_date ON fee_payments (payment_date);
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

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "users_read_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin_read_all_profiles" ON user_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_update_profiles" ON user_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- School profile policies
CREATE POLICY "all_read_school_profile" ON school_profile FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_update_school_profile" ON school_profile FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Academic years policies
CREATE POLICY "all_read_academic_years" ON academic_years FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_manage_academic_years" ON academic_years FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Standards policies
CREATE POLICY "all_read_standards" ON standards FOR SELECT TO authenticated USING (TRUE);

-- Fee configurations policies
CREATE POLICY "finance_admin_read_fee_configs" ON fee_configurations FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);
CREATE POLICY "admin_manage_fee_configs" ON fee_configurations FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Students policies
CREATE POLICY "auth_read_students" ON students FOR SELECT TO authenticated USING (is_deleted = FALSE);
CREATE POLICY "finance_admin_staff_insert_students" ON students FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance','staff'))
);
CREATE POLICY "finance_admin_staff_update_students" ON students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance','staff'))
);

-- Fee payments policies
CREATE POLICY "auth_read_fee_payments" ON fee_payments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "finance_admin_insert_fee_payments" ON fee_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);

-- Audit logs policies
CREATE POLICY "admin_read_audit_logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "all_insert_audit_logs" ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_profile_updated_at BEFORE UPDATE ON school_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_configurations_updated_at BEFORE UPDATE ON fee_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo fee configurations
DO $$
DECLARE
  std_nursery UUID;
  std_lkg UUID;
  std_ukg UUID;
  std_1 UUID;
  std_2 UUID;
  current_year UUID;
BEGIN
  -- Get standard IDs
  SELECT id INTO std_nursery FROM standards WHERE name = 'Nursery';
  SELECT id INTO std_lkg FROM standards WHERE name = 'LKG';
  SELECT id INTO std_ukg FROM standards WHERE name = 'UKG';
  SELECT id INTO std_1 FROM standards WHERE name = 'I';
  SELECT id INTO std_2 FROM standards WHERE name = 'II';
  
  -- Get current academic year
  SELECT id INTO current_year FROM academic_years WHERE is_current = true;
  
  -- Insert fee configurations for current year
  INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise) VALUES
    (current_year, std_nursery, 'all', 800000),  -- ₹8,000
    (current_year, std_lkg, 'all', 900000),      -- ₹9,000
    (current_year, std_ukg, 'all', 1000000),     -- ₹10,000
    (current_year, std_1, 'all', 1100000),       -- ₹11,000
    (current_year, std_2, 'all', 1100000);       -- ₹11,000
END $$;

-- Insert demo students
DO $$
DECLARE
  std_nursery UUID;
  std_lkg UUID;
  current_year UUID;
BEGIN
  -- Get IDs
  SELECT id INTO std_nursery FROM standards WHERE name = 'Nursery';
  SELECT id INTO std_lkg FROM standards WHERE name = 'LKG';
  SELECT id INTO current_year FROM academic_years WHERE is_current = true;
  
  -- Insert demo students
  INSERT INTO students (
    academic_year_id, standard_id, roll_number, full_name, guardian_name, 
    phone, gender, dob, address, admission_date, annual_fee_paise, 
    fee_paid_paise, status
  ) VALUES
    (current_year, std_nursery, '001', 'Aarav Sharma', 'Rajesh Sharma', '+91 98765 43210', 'male', '2020-03-15', '123 Main Street, Delhi', '2024-06-01', 800000, 400000, 'active'),
    (current_year, std_lkg, '002', 'Priya Patel', 'Suresh Patel', '+91 87654 32109', 'female', '2019-07-22', '456 Park Avenue, Mumbai', '2024-06-01', 900000, 900000, 'active'),
    (current_year, std_nursery, '003', 'Arjun Kumar', 'Vikram Kumar', '+91 76543 21098', 'male', '2020-01-10', '789 Garden Road, Bangalore', '2024-06-01', 800000, 200000, 'active');
END $$;