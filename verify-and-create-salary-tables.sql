-- ============================================================================
-- VERIFY AND CREATE SALARY PAYMENT TABLES
-- ============================================================================
-- Run this to check if tables exist and create them if needed
-- ============================================================================

-- Step 1: Check if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_salary_payments'
  ) THEN
    RAISE NOTICE '✓ teacher_salary_payments table already exists';
  ELSE
    RAISE NOTICE '✗ teacher_salary_payments table does NOT exist - will create it';
  END IF;
END $$;

-- Step 2: Show existing columns if table exists
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_salary_payments'
ORDER BY ordinal_position;

-- Step 3: If no results above, run the creation script below
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teacher_salary_payments table
CREATE TABLE IF NOT EXISTS teacher_salary_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  
  -- Payment details
  salary_month DATE NOT NULL,
  payment_date DATE NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  
  -- Payment method
  payment_method TEXT NOT NULL CHECK (payment_method IN 
    ('cash', 'bank_transfer', 'cheque', 'upi', 'neft', 'rtgs', 'dd')),
  reference_number TEXT,
  receipt_number TEXT,
  
  -- Salary components (optional breakdown)
  base_salary_paise BIGINT,
  hra_paise BIGINT DEFAULT 0,
  da_paise BIGINT DEFAULT 0,
  ta_paise BIGINT DEFAULT 0,
  other_allowances_paise BIGINT DEFAULT 0,
  
  -- Deductions
  pf_deduction_paise BIGINT DEFAULT 0,
  esi_deduction_paise BIGINT DEFAULT 0,
  tds_deduction_paise BIGINT DEFAULT 0,
  loan_deduction_paise BIGINT DEFAULT 0,
  other_deductions_paise BIGINT DEFAULT 0,
  
  -- Working days
  working_days INTEGER,
  total_days INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  
  -- Audit trail
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (teacher_id, salary_month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_salary_payments_teacher 
  ON teacher_salary_payments(teacher_id, salary_month DESC);

CREATE INDEX IF NOT EXISTS idx_salary_payments_month 
  ON teacher_salary_payments(salary_month DESC);

CREATE INDEX IF NOT EXISTS idx_salary_payments_status 
  ON teacher_salary_payments(status);

-- Enable RLS
ALTER TABLE teacher_salary_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view salary payments" ON teacher_salary_payments;
DROP POLICY IF EXISTS "Authorized users can insert payments" ON teacher_salary_payments;
DROP POLICY IF EXISTS "Authorized users can update payments" ON teacher_salary_payments;

-- Create policies
CREATE POLICY "Users can view salary payments" ON teacher_salary_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can insert payments" ON teacher_salary_payments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Authorized users can update payments" ON teacher_salary_payments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'finance')
    )
  );

-- Grant permissions
GRANT SELECT ON teacher_salary_payments TO authenticated;
GRANT ALL ON teacher_salary_payments TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ teacher_salary_payments table created';
  RAISE NOTICE '✓ Indexes created';
  RAISE NOTICE '✓ RLS policies enabled';
  RAISE NOTICE '✓ Permissions granted';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Refresh your browser to clear Supabase cache!';
  RAISE NOTICE 'Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)';
END $$;
