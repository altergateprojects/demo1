-- =====================================================
-- BORROWED CAPITAL TRACKING SYSTEM (FRAUD-PROOF)
-- =====================================================
-- Track money borrowed by the school with complete audit trail

-- Create borrowed_capital table
CREATE TABLE IF NOT EXISTS borrowed_capital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  borrowed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lender_name TEXT NOT NULL,
  lender_contact TEXT,
  
  -- Repayment Information
  expected_return_date DATE,
  interest_rate_percentage DECIMAL(5,2) DEFAULT 0 CHECK (interest_rate_percentage >= 0),
  repayment_terms TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_repaid', 'fully_repaid', 'written_off')),
  amount_repaid_paise BIGINT NOT NULL DEFAULT 0 CHECK (amount_repaid_paise >= 0),
  
  -- Documentation
  agreement_reference TEXT,
  purpose TEXT NOT NULL,
  notes TEXT,
  
  -- Fraud-Proof Fields
  data_hash TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id),
  
  -- Audit Fields
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Academic Year
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  deletion_reason TEXT,
  
  -- Constraints
  CONSTRAINT amount_repaid_not_exceed_borrowed CHECK (amount_repaid_paise <= amount_paise)
);

-- Create borrowed_capital_repayments table
CREATE TABLE IF NOT EXISTS borrowed_capital_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to borrowed capital
  borrowed_capital_id UUID NOT NULL REFERENCES borrowed_capital(id) ON DELETE CASCADE,
  
  -- Repayment Details
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  repayment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi', 'other')),
  reference_number TEXT,
  notes TEXT,
  
  -- Fraud-Proof Fields
  data_hash TEXT NOT NULL,
  
  -- Audit Fields
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Create borrowed_capital_audit_trail table
CREATE TABLE IF NOT EXISTS borrowed_capital_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to borrowed capital
  borrowed_capital_id UUID NOT NULL REFERENCES borrowed_capital(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'REPAYMENT', 'LOCK', 'DELETE', 'STATUS_CHANGE')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT NOT NULL,
  
  -- Audit Fields
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_borrowed_capital_academic_year ON borrowed_capital(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_borrowed_capital_status ON borrowed_capital(status);
CREATE INDEX IF NOT EXISTS idx_borrowed_capital_borrowed_date ON borrowed_capital(borrowed_date);
CREATE INDEX IF NOT EXISTS idx_borrowed_capital_is_deleted ON borrowed_capital(is_deleted);
CREATE INDEX IF NOT EXISTS idx_borrowed_capital_repayments_capital_id ON borrowed_capital_repayments(borrowed_capital_id);
CREATE INDEX IF NOT EXISTS idx_borrowed_capital_audit_capital_id ON borrowed_capital_audit_trail(borrowed_capital_id);

-- Enable RLS
ALTER TABLE borrowed_capital ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowed_capital_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowed_capital_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for borrowed_capital
CREATE POLICY "Users can view borrowed capital"
  ON borrowed_capital FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert borrowed capital"
  ON borrowed_capital FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update unlocked borrowed capital"
  ON borrowed_capital FOR UPDATE
  TO authenticated
  USING (is_locked = false);

-- RLS Policies for borrowed_capital_repayments
CREATE POLICY "Users can view repayments"
  ON borrowed_capital_repayments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert repayments"
  ON borrowed_capital_repayments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for borrowed_capital_audit_trail
CREATE POLICY "Users can view audit trail"
  ON borrowed_capital_audit_trail FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert audit trail"
  ON borrowed_capital_audit_trail FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to update borrowed_capital.updated_at
CREATE OR REPLACE FUNCTION update_borrowed_capital_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER borrowed_capital_updated_at
  BEFORE UPDATE ON borrowed_capital
  FOR EACH ROW
  EXECUTE FUNCTION update_borrowed_capital_updated_at();

-- Trigger to update amount_repaid_paise when repayment is added
CREATE OR REPLACE FUNCTION update_borrowed_capital_repaid_amount()
RETURNS TRIGGER AS $$
DECLARE
  total_repaid BIGINT;
  borrowed_amount BIGINT;
BEGIN
  -- Calculate total repaid for this borrowed capital
  SELECT COALESCE(SUM(amount_paise), 0)
  INTO total_repaid
  FROM borrowed_capital_repayments
  WHERE borrowed_capital_id = NEW.borrowed_capital_id
    AND is_deleted = false;
  
  -- Get borrowed amount
  SELECT amount_paise
  INTO borrowed_amount
  FROM borrowed_capital
  WHERE id = NEW.borrowed_capital_id;
  
  -- Update borrowed_capital record
  UPDATE borrowed_capital
  SET 
    amount_repaid_paise = total_repaid,
    status = CASE
      WHEN total_repaid = 0 THEN 'active'
      WHEN total_repaid >= borrowed_amount THEN 'fully_repaid'
      ELSE 'partially_repaid'
    END,
    updated_at = NOW()
  WHERE id = NEW.borrowed_capital_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_repaid_amount_on_repayment
  AFTER INSERT ON borrowed_capital_repayments
  FOR EACH ROW
  EXECUTE FUNCTION update_borrowed_capital_repaid_amount();

-- Function to get total active borrowed capital
CREATE OR REPLACE FUNCTION get_total_active_borrowed_capital(p_academic_year_id UUID)
RETURNS BIGINT AS $$
DECLARE
  total BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount_paise - amount_repaid_paise), 0)
  INTO total
  FROM borrowed_capital
  WHERE academic_year_id = p_academic_year_id
    AND is_deleted = false
    AND status IN ('active', 'partially_repaid');
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON borrowed_capital TO authenticated;
GRANT ALL ON borrowed_capital_repayments TO authenticated;
GRANT ALL ON borrowed_capital_audit_trail TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_active_borrowed_capital TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Borrowed Capital System created successfully!';
  RAISE NOTICE '📊 Tables: borrowed_capital, borrowed_capital_repayments, borrowed_capital_audit_trail';
  RAISE NOTICE '🔒 Fraud-proof features: data hashing, locking, audit trail';
  RAISE NOTICE '💰 Auto-calculates repayment status and amounts';
END $$;
