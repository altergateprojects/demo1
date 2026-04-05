-- Teacher Salary Management Schema
-- This creates tables for individual teacher salaries, salary history, and bonuses

-- 1. Add salary fields to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS current_salary_paise BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS salary_effective_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS salary_notes TEXT;

-- 2. Create teacher_salary_history table for tracking salary changes
CREATE TABLE IF NOT EXISTS teacher_salary_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  old_salary_paise BIGINT,
  new_salary_paise BIGINT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_reason TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('initial', 'increment', 'decrement', 'adjustment')),
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create teacher_bonuses table for bonus tracking
CREATE TABLE IF NOT EXISTS teacher_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('performance', 'festival', 'annual', 'special', 'other')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  bonus_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  paid_date DATE,
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create teacher_salary_payments table for monthly salary payments tracking
CREATE TABLE IF NOT EXISTS teacher_salary_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  salary_month DATE NOT NULL, -- First day of the month (e.g., 2024-01-01 for January 2024)
  base_salary_paise BIGINT NOT NULL,
  bonus_amount_paise BIGINT DEFAULT 0,
  deduction_amount_paise BIGINT DEFAULT 0,
  total_amount_paise BIGINT NOT NULL,
  payment_date DATE,
  payment_method TEXT DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi')),
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salary_history_teacher ON teacher_salary_history (teacher_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_salary_history_academic_year ON teacher_salary_history (academic_year_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_teacher ON teacher_bonuses (teacher_id, bonus_date DESC);
CREATE INDEX IF NOT EXISTS idx_bonuses_academic_year ON teacher_bonuses (academic_year_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_status ON teacher_bonuses (status);
CREATE INDEX IF NOT EXISTS idx_salary_payments_teacher ON teacher_salary_payments (teacher_id, salary_month DESC);
CREATE INDEX IF NOT EXISTS idx_salary_payments_month ON teacher_salary_payments (salary_month);
CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON teacher_salary_payments (status);

-- 6. Enable RLS on new tables
ALTER TABLE teacher_salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_salary_payments ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Salary History policies
CREATE POLICY "authenticated_read_salary_history" ON teacher_salary_history 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_finance_manage_salary_history" ON teacher_salary_history 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'finance')
    )
  );

-- Bonuses policies
CREATE POLICY "authenticated_read_bonuses" ON teacher_bonuses 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_finance_manage_bonuses" ON teacher_bonuses 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'finance')
    )
  );

-- Salary Payments policies
CREATE POLICY "authenticated_read_salary_payments" ON teacher_salary_payments 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_finance_manage_salary_payments" ON teacher_salary_payments 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'finance')
    )
  );

-- 8. Add updated_at triggers
CREATE TRIGGER update_salary_history_updated_at 
  BEFORE UPDATE ON teacher_salary_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonuses_updated_at 
  BEFORE UPDATE ON teacher_bonuses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_payments_updated_at 
  BEFORE UPDATE ON teacher_salary_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function to update teacher current salary
CREATE OR REPLACE FUNCTION update_teacher_current_salary() RETURNS TRIGGER AS $$
BEGIN
  -- Update teacher's current salary when a new salary history record is added
  UPDATE teachers
  SET current_salary_paise = NEW.new_salary_paise,
      salary_effective_date = NEW.effective_date,
      updated_at = NOW()
  WHERE id = NEW.teacher_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically update teacher's current salary
CREATE TRIGGER trg_update_teacher_salary 
  AFTER INSERT ON teacher_salary_history 
  FOR EACH ROW 
  EXECUTE FUNCTION update_teacher_current_salary();

-- 11. Create unique constraints
ALTER TABLE teacher_salary_payments 
ADD CONSTRAINT unique_teacher_salary_month 
UNIQUE (teacher_id, salary_month);

-- 12. Create view for teacher salary summary
CREATE OR REPLACE VIEW teacher_salary_summary AS
SELECT 
  t.id as teacher_id,
  t.full_name,
  t.current_salary_paise,
  t.salary_effective_date,
  t.status as teacher_status,
  
  -- Latest salary change
  (SELECT tsh.change_type 
   FROM teacher_salary_history tsh 
   WHERE tsh.teacher_id = t.id 
   ORDER BY tsh.effective_date DESC, tsh.created_at DESC 
   LIMIT 1) as last_salary_change_type,
   
  (SELECT tsh.effective_date 
   FROM teacher_salary_history tsh 
   WHERE tsh.teacher_id = t.id 
   ORDER BY tsh.effective_date DESC, tsh.created_at DESC 
   LIMIT 1) as last_salary_change_date,
   
  -- Bonus summary for current academic year
  COALESCE((SELECT SUM(tb.amount_paise) 
            FROM teacher_bonuses tb 
            JOIN academic_years ay ON tb.academic_year_id = ay.id
            WHERE tb.teacher_id = t.id 
            AND ay.is_current = true 
            AND tb.status = 'approved'), 0) as current_year_bonuses_paise,
            
  -- Salary payments summary for current academic year
  COALESCE((SELECT COUNT(*) 
            FROM teacher_salary_payments tsp 
            JOIN academic_years ay ON tsp.academic_year_id = ay.id
            WHERE tsp.teacher_id = t.id 
            AND ay.is_current = true 
            AND tsp.status = 'paid'), 0) as current_year_payments_count,
            
  COALESCE((SELECT SUM(tsp.total_amount_paise) 
            FROM teacher_salary_payments tsp 
            JOIN academic_years ay ON tsp.academic_year_id = ay.id
            WHERE tsp.teacher_id = t.id 
            AND ay.is_current = true 
            AND tsp.status = 'paid'), 0) as current_year_total_paid_paise

FROM teachers t
WHERE t.is_deleted = false;

-- Success message
SELECT 'Teacher salary management schema created successfully!' as status;

-- Show summary of created tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('teacher_salary_history', 'teacher_bonuses', 'teacher_salary_payments')
ORDER BY table_name;