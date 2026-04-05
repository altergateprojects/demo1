-- Ensure expenses table exists with proper structure
DROP TABLE IF EXISTS public.expenses CASCADE;

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
  type TEXT NOT NULL CHECK (type IN ('debit','refund')) DEFAULT 'debit',
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

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.expenses;

-- Create simple RLS policy for testing
CREATE POLICY "Allow all for authenticated users" ON public.expenses
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_date_year ON expenses (expense_date, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_recorded_by ON expenses (recorded_by);
CREATE INDEX IF NOT EXISTS idx_expenses_approval ON expenses (needs_approval, is_approved);

-- Insert some sample data for testing
INSERT INTO expenses (
  academic_year_id,
  expense_date,
  category,
  description,
  amount_paise,
  type,
  payment_method,
  recorded_by
) VALUES (
  (SELECT id FROM academic_years WHERE is_current = true LIMIT 1),
  CURRENT_DATE,
  'utilities',
  'Monthly electricity bill payment for school premises',
  500000, -- ₹5000
  'debit',
  'bank_transfer',
  (SELECT id FROM user_profiles WHERE is_active = true LIMIT 1)
),
(
  (SELECT id FROM academic_years WHERE is_current = true LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day',
  'stationery',
  'Purchase of notebooks and pens for students',
  250000, -- ₹2500
  'debit',
  'cash',
  (SELECT id FROM user_profiles WHERE is_active = true LIMIT 1)
),
(
  (SELECT id FROM academic_years WHERE is_current = true LIMIT 1),
  CURRENT_DATE - INTERVAL '2 days',
  'cleaning_sanitation',
  'Monthly cleaning supplies and sanitizers',
  150000, -- ₹1500
  'debit',
  'upi',
  (SELECT id FROM user_profiles WHERE is_active = true LIMIT 1)
);