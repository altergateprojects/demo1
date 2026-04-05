-- Create Pocket Money Transactions Table
-- Run this in Supabase SQL Editor

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

-- Create indexes
CREATE INDEX idx_pocket_money_student ON pocket_money_transactions (student_id, transaction_date DESC);
CREATE INDEX idx_pocket_money_date ON pocket_money_transactions (transaction_date DESC);
CREATE INDEX idx_pocket_money_type ON pocket_money_transactions (transaction_type);

-- Enable RLS
ALTER TABLE pocket_money_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "authenticated_read_pocket_money" ON pocket_money_transactions 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_pocket_money" ON pocket_money_transactions 
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add updated_at trigger
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
CREATE TRIGGER trg_update_pocket_money_balance 
  AFTER INSERT ON pocket_money_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_student_pocket_money();