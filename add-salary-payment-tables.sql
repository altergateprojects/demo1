-- ============================================================================
-- ADD SALARY PAYMENT TABLES TO EXISTING SYSTEM
-- ============================================================================
-- This script adds new tables without modifying existing ones
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: teacher_salary_payments
-- ============================================================================
-- Records monthly salary payments with complete audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS teacher_salary_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  
  -- Payment details
  salary_month DATE NOT NULL, -- First day of the month (YYYY-MM-01)
  payment_date DATE NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  
  -- Payment method
  payment_method TEXT NOT NULL CHECK (payment_method IN 
    ('cash', 'bank_transfer', 'cheque', 'upi', 'neft', 'rtgs', 'dd')),
  reference_number TEXT, -- Transaction ID, Cheque number, etc.
  receipt_number TEXT,
  
  -- Salary components (optional breakdown)
  base_salary_paise BIGINT,
  hra_paise BIGINT DEFAULT 0, -- House Rent Allowance
  da_paise BIGINT DEFAULT 0, -- Dearness Allowance
  ta_paise BIGINT DEFAULT 0, -- Transport Allowance
  other_allowances_paise BIGINT DEFAULT 0,
  
  -- Deductions
  pf_deduction_paise BIGINT DEFAULT 0, -- Provident Fund
  esi_deduction_paise BIGINT DEFAULT 0, -- Employee State Insurance
  tds_deduction_paise BIGINT DEFAULT 0, -- Tax Deducted at Source
  loan_deduction_paise BIGINT DEFAULT 0,
  other_deductions_paise BIGINT DEFAULT 0,
  
  -- Working days (for pro-rata calculation)
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
  UNIQUE (teacher_id, salary_month),
  CHECK (status = 'paid' OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_salary_payments_teacher 
  ON teacher_salary_payments(teacher_id, salary_month DESC);

CREATE INDEX IF NOT EXISTS idx_salary_payments_month 
  ON teacher_salary_payments(salary_month DESC);

CREATE INDEX IF NOT EXISTS idx_salary_payments_status 
  ON teacher_salary_payments(status);

CREATE INDEX IF NOT EXISTS idx_salary_payments_date 
  ON teacher_salary_payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_salary_payments_academic_year
  ON teacher_salary_payments(academic_year_id);

COMMENT ON TABLE teacher_salary_payments IS 'Monthly salary payment records with complete audit trail';

-- ============================================================================
-- TABLE 2: teacher_payment_reminders
-- ============================================================================
-- Automated reminder system for pending payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS teacher_payment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  salary_month DATE NOT NULL,
  due_date DATE NOT NULL,
  reminder_date DATE NOT NULL,
  
  -- Status
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (teacher_id, salary_month)
);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_due 
  ON teacher_payment_reminders(due_date) 
  WHERE is_sent = FALSE AND is_dismissed = FALSE;

COMMENT ON TABLE teacher_payment_reminders IS 'Automated payment reminders for teachers';

-- ============================================================================
-- TABLE 3: teacher_advances
-- ============================================================================
-- Track salary advances and loans
-- ============================================================================

CREATE TABLE IF NOT EXISTS teacher_advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  
  -- Advance details
  advance_type TEXT NOT NULL CHECK (advance_type IN ('salary_advance', 'festival_advance', 'emergency_loan', 'other')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  advance_date DATE NOT NULL,
  reason TEXT NOT NULL,
  
  -- Repayment
  repayment_months INTEGER NOT NULL CHECK (repayment_months > 0),
  monthly_deduction_paise BIGINT NOT NULL CHECK (monthly_deduction_paise > 0),
  amount_repaid_paise BIGINT NOT NULL DEFAULT 0,
  balance_paise BIGINT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  
  -- Audit
  approved_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (balance_paise >= 0),
  CHECK (amount_repaid_paise <= amount_paise)
);

CREATE INDEX IF NOT EXISTS idx_advances_teacher 
  ON teacher_advances(teacher_id, status);

CREATE INDEX IF NOT EXISTS idx_advances_academic_year
  ON teacher_advances(academic_year_id);

COMMENT ON TABLE teacher_advances IS 'Salary advances and loans with repayment tracking';

-- ============================================================================
-- ENHANCE EXISTING TABLES (Add columns if they don't exist)
-- ============================================================================

-- Add columns to teacher_bonuses if they don't exist
DO $$
BEGIN
  -- Add payment_method if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_bonuses' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE teacher_bonuses ADD COLUMN payment_method TEXT DEFAULT 'cash'
      CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi', 'neft', 'rtgs', 'dd'));
  END IF;
  
  -- Add reference_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_bonuses' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE teacher_bonuses ADD COLUMN reference_number TEXT;
  END IF;
  
  -- Add receipt_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_bonuses' AND column_name = 'receipt_number'
  ) THEN
    ALTER TABLE teacher_bonuses ADD COLUMN receipt_number TEXT;
  END IF;
  
  -- Add bonus_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_bonuses' AND column_name = 'bonus_type'
  ) THEN
    ALTER TABLE teacher_bonuses ADD COLUMN bonus_type TEXT DEFAULT 'performance'
      CHECK (bonus_type IN ('performance', 'festival', 'annual', 'special', 'other'));
  END IF;
END $$;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get payment status for a teacher in a specific month
CREATE OR REPLACE FUNCTION get_teacher_payment_status(
  p_teacher_id UUID,
  p_month DATE
)
RETURNS TABLE (
  teacher_id UUID,
  teacher_name TEXT,
  current_salary_paise BIGINT,
  salary_month DATE,
  is_paid BOOLEAN,
  payment_date DATE,
  amount_paid_paise BIGINT,
  due_date DATE,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.full_name,
    t.current_salary_paise,
    p_month,
    (sp.id IS NOT NULL) as is_paid,
    sp.payment_date,
    sp.amount_paise,
    (p_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE as due_date,
    (CURRENT_DATE > (p_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE AND sp.id IS NULL) as is_overdue
  FROM teachers t
  LEFT JOIN teacher_salary_payments sp ON sp.teacher_id = t.id 
    AND sp.salary_month = p_month 
    AND sp.status = 'paid'
  WHERE t.id = p_teacher_id
    AND t.status = 'active'
    AND t.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all pending payments for a month
CREATE OR REPLACE FUNCTION get_pending_salary_payments(p_month DATE)
RETURNS TABLE (
  teacher_id UUID,
  teacher_name TEXT,
  subject TEXT,
  current_salary_paise BIGINT,
  due_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.full_name,
    t.subject,
    t.current_salary_paise,
    (p_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE as due_date,
    GREATEST(0, CURRENT_DATE - (p_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE) as days_overdue
  FROM teachers t
  WHERE t.status = 'active'
    AND t.is_deleted = FALSE
    AND NOT EXISTS (
      SELECT 1 FROM teacher_salary_payments sp
      WHERE sp.teacher_id = t.id
        AND sp.salary_month = p_month
        AND sp.status = 'paid'
    )
  ORDER BY days_overdue DESC, t.full_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to salary_payments if not exists
DROP TRIGGER IF EXISTS update_salary_payments_updated_at ON teacher_salary_payments;
CREATE TRIGGER update_salary_payments_updated_at
  BEFORE UPDATE ON teacher_salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to advances if not exists
DROP TRIGGER IF EXISTS update_advances_updated_at ON teacher_advances;
CREATE TRIGGER update_advances_updated_at
  BEFORE UPDATE ON teacher_advances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE teacher_salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_advances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view salary payments" ON teacher_salary_payments;
DROP POLICY IF EXISTS "Authorized users can insert payments" ON teacher_salary_payments;
DROP POLICY IF EXISTS "Authorized users can update payments" ON teacher_salary_payments;
DROP POLICY IF EXISTS "Users can view reminders" ON teacher_payment_reminders;
DROP POLICY IF EXISTS "System can manage reminders" ON teacher_payment_reminders;
DROP POLICY IF EXISTS "Users can view advances" ON teacher_advances;
DROP POLICY IF EXISTS "Authorized users can manage advances" ON teacher_advances;

-- Policies for teacher_salary_payments
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

-- Policies for reminders
CREATE POLICY "Users can view reminders" ON teacher_payment_reminders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage reminders" ON teacher_payment_reminders
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for advances
CREATE POLICY "Users can view advances" ON teacher_advances
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage advances" ON teacher_advances
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role IN ('admin', 'finance')
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON teacher_salary_payments TO authenticated;
GRANT SELECT ON teacher_payment_reminders TO authenticated;
GRANT SELECT ON teacher_advances TO authenticated;
GRANT ALL ON teacher_salary_payments TO service_role;
GRANT ALL ON teacher_payment_reminders TO service_role;
GRANT ALL ON teacher_advances TO service_role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Teacher Salary Payment System tables created successfully';
  RAISE NOTICE '✓ Tables: teacher_salary_payments, teacher_payment_reminders, teacher_advances';
  RAISE NOTICE '✓ Enhanced: teacher_bonuses (added payment_method, reference_number, receipt_number, bonus_type)';
  RAISE NOTICE '✓ Functions: get_teacher_payment_status, get_pending_salary_payments';
  RAISE NOTICE '✓ RLS policies enabled';
  RAISE NOTICE '✓ Ready for salary payment operations';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Column name is "salary_month" not "payment_month"';
END $$;
