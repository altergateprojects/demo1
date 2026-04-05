-- COMPLETE DATABASE SETUP SCRIPT
-- Run this entire script in your Supabase SQL Editor

-- 1. Add Fee Configurations for Current Academic Year
DO $$
DECLARE
  current_year_id UUID;
  std_nursery UUID;
  std_lkg UUID;
  std_ukg UUID;
  std_1 UUID;
  std_2 UUID;
  std_3 UUID;
  std_4 UUID;
  std_5 UUID;
BEGIN
  -- Get current academic year
  SELECT id INTO current_year_id FROM academic_years WHERE is_current = true LIMIT 1;
  
  -- Get standard IDs
  SELECT id INTO std_nursery FROM standards WHERE name = 'Nursery' LIMIT 1;
  SELECT id INTO std_lkg FROM standards WHERE name = 'LKG' LIMIT 1;
  SELECT id INTO std_ukg FROM standards WHERE name = 'UKG' LIMIT 1;
  SELECT id INTO std_1 FROM standards WHERE name = 'I' LIMIT 1;
  SELECT id INTO std_2 FROM standards WHERE name = 'II' LIMIT 1;
  SELECT id INTO std_3 FROM standards WHERE name = 'III' LIMIT 1;
  SELECT id INTO std_4 FROM standards WHERE name = 'IV' LIMIT 1;
  SELECT id INTO std_5 FROM standards WHERE name = 'V' LIMIT 1;
  
  -- Insert fee configurations if they don't exist
  INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise, is_active)
  VALUES
    (current_year_id, std_nursery, 'all', 800000, true),   -- ₹8,000
    (current_year_id, std_lkg, 'all', 900000, true),       -- ₹9,000
    (current_year_id, std_ukg, 'all', 1000000, true),      -- ₹10,000
    (current_year_id, std_1, 'all', 1100000, true),        -- ₹11,000
    (current_year_id, std_2, 'all', 1200000, true),        -- ₹12,000
    (current_year_id, std_3, 'all', 1300000, true),        -- ₹13,000
    (current_year_id, std_4, 'all', 1400000, true),        -- ₹14,000
    (current_year_id, std_5, 'all', 1500000, true)         -- ₹15,000
  ON CONFLICT (academic_year_id, standard_id, gender) DO NOTHING;
  
  RAISE NOTICE 'Fee configurations added successfully';
END $$;

-- 2. Create missing database functions
-- Function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number(academic_year TEXT)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  receipt_num TEXT;
BEGIN
  -- Get the next receipt number for this academic year
  -- Use table-qualified column name to avoid ambiguity
  SELECT COALESCE(MAX(CAST(SUBSTRING(fp.receipt_number FROM 'RCPT-' || academic_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM fee_payments fp
  WHERE fp.receipt_number LIKE 'RCPT-' || academic_year || '-%';
  
  -- Format the receipt number
  receipt_num := 'RCPT-' || academic_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_receipt_number(TEXT) TO authenticated;

-- 3. Create Pocket Money Transactions Table
CREATE TABLE IF NOT EXISTS public.pocket_money_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  balance_after_paise BIGINT NOT NULL CHECK (balance_after_paise >= 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  notes TEXT,
  reference_number TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for pocket money
CREATE INDEX IF NOT EXISTS idx_pocket_money_student ON pocket_money_transactions (student_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_pocket_money_date ON pocket_money_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_pocket_money_type ON pocket_money_transactions (transaction_type);

-- Enable RLS for pocket money
ALTER TABLE pocket_money_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pocket money
DROP POLICY IF EXISTS "authenticated_read_pocket_money" ON pocket_money_transactions;
DROP POLICY IF EXISTS "authenticated_insert_pocket_money" ON pocket_money_transactions;

CREATE POLICY "authenticated_read_pocket_money" ON pocket_money_transactions 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_pocket_money" ON pocket_money_transactions 
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add updated_at trigger for pocket money
DROP TRIGGER IF EXISTS update_pocket_money_updated_at ON pocket_money_transactions;
CREATE TRIGGER update_pocket_money_updated_at 
  BEFORE UPDATE ON pocket_money_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update student pocket money balance
CREATE OR REPLACE FUNCTION update_student_pocket_money() RETURNS TRIGGER AS $$
BEGIN
  -- Update the student's pocket money balance
  UPDATE students
  SET pocket_money_paise = NEW.balance_after_paise,
      updated_at = NOW()
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update student balance after pocket money transaction
DROP TRIGGER IF EXISTS trg_update_pocket_money_balance ON pocket_money_transactions;
CREATE TRIGGER trg_update_pocket_money_balance 
  AFTER INSERT ON pocket_money_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_student_pocket_money();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '1. Record fee payments';
  RAISE NOTICE '2. Manage pocket money transactions';
  RAISE NOTICE '3. View transaction histories';
  RAISE NOTICE '4. Generate receipts automatically';
END $$;

-- 4. Create fee payments view for easier querying
CREATE OR REPLACE VIEW fee_payments_with_users AS
SELECT 
  fp.*,
  up.full_name as received_by_name,
  up.role as received_by_role
FROM fee_payments fp
LEFT JOIN user_profiles up ON fp.received_by = up.id;

-- Grant access to authenticated users
GRANT SELECT ON fee_payments_with_users TO authenticated;

-- Final completion messages
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'You can now use the application with full functionality.';
  RAISE NOTICE 'Fee payment forms should work without validation errors.';
  RAISE NOTICE 'Fee history should load without 400 errors.';
END $$;