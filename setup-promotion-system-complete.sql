-- ============================================================================
-- COMPLETE STUDENT PROMOTION SYSTEM SETUP
-- ============================================================================
-- This script sets up the entire promotion system in one go.
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns to existing tables
-- ============================================================================

-- Add promotion tracking columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS last_promoted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS promotion_eligible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS promotion_hold_reason TEXT;

-- Add promotion tracking to academic_years
ALTER TABLE academic_years
ADD COLUMN IF NOT EXISTS promotion_window_start DATE,
ADD COLUMN IF NOT EXISTS promotion_window_end DATE,
ADD COLUMN IF NOT EXISTS allow_promotions BOOLEAN DEFAULT TRUE;

-- Add capacity and final year flag to standards
ALTER TABLE standards
ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
ADD COLUMN IF NOT EXISTS is_final_year BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 2: Create new tables
-- ============================================================================

-- Table 1: student_year_snapshots (immutable audit trail)
CREATE TABLE IF NOT EXISTS student_year_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  standard_id UUID NOT NULL REFERENCES standards(id),
  
  -- Financial snapshot at year end
  annual_fee_paise BIGINT NOT NULL DEFAULT 0,
  fee_paid_paise BIGINT NOT NULL DEFAULT 0,
  fee_due_paise BIGINT NOT NULL DEFAULT 0,
  pocket_money_paise BIGINT NOT NULL DEFAULT 0,
  
  -- Promotion details
  promotion_status TEXT NOT NULL CHECK (promotion_status IN ('promoted', 'repeated', 'left_school', 'graduated')),
  promoted_to_standard_id UUID REFERENCES standards(id),
  promoted_to_academic_year_id UUID REFERENCES academic_years(id),
  
  -- Dues handling
  dues_action TEXT NOT NULL CHECK (dues_action IN ('carried_forward', 'waived', 'paid_before_promotion')),
  dues_carried_forward_paise BIGINT NOT NULL DEFAULT 0,
  
  -- Metadata
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Indexes
  CONSTRAINT unique_student_year_snapshot UNIQUE (student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_student ON student_year_snapshots(student_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_year ON student_year_snapshots(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON student_year_snapshots(snapshot_date);

-- Table 2: promotion_batches (bulk promotion tracking)
CREATE TABLE IF NOT EXISTS promotion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT,
  source_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  target_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  target_standard_id UUID REFERENCES standards(id),
  
  -- Batch statistics
  total_students INTEGER NOT NULL DEFAULT 0,
  successful_promotions INTEGER NOT NULL DEFAULT 0,
  failed_promotions INTEGER NOT NULL DEFAULT 0,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_batches_source_year ON promotion_batches(source_academic_year_id);
CREATE INDEX IF NOT EXISTS idx_batches_target_year ON promotion_batches(target_academic_year_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON promotion_batches(status);

-- Table 3: student_promotion_history (detailed promotion log)
CREATE TABLE IF NOT EXISTS student_promotion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES student_year_snapshots(id),
  batch_id UUID REFERENCES promotion_batches(id),
  
  -- Promotion details
  from_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  to_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  from_standard_id UUID NOT NULL REFERENCES standards(id),
  to_standard_id UUID REFERENCES standards(id),
  promotion_status TEXT NOT NULL CHECK (promotion_status IN ('promoted', 'repeated', 'left_school', 'graduated')),
  
  -- Reversal tracking
  is_reversed BOOLEAN DEFAULT FALSE,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES auth.users(id),
  reversal_reason TEXT,
  
  -- Metadata
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  promoted_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_student ON student_promotion_history(student_id);
CREATE INDEX IF NOT EXISTS idx_history_from_year ON student_promotion_history(from_academic_year_id);
CREATE INDEX IF NOT EXISTS idx_history_to_year ON student_promotion_history(to_academic_year_id);
CREATE INDEX IF NOT EXISTS idx_history_batch ON student_promotion_history(batch_id);

-- Table 4: fee_adjustments (manual fee corrections)
CREATE TABLE IF NOT EXISTS fee_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  
  -- Adjustment details
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('waiver', 'discount', 'penalty', 'correction')),
  amount_paise BIGINT NOT NULL,
  reason TEXT NOT NULL,
  
  -- Approval tracking
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_adjustments_student ON fee_adjustments(student_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_year ON fee_adjustments(academic_year_id);

-- ============================================================================
-- STEP 3: Create helper function for calculating pending dues
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_pending_dues(p_student_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_dues BIGINT;
  v_previous_dues BIGINT;
  v_pocket_money BIGINT;
  v_total BIGINT;
BEGIN
  -- Get current year dues
  SELECT 
    GREATEST(annual_fee_paise - fee_paid_paise, 0),
    pocket_money_paise
  INTO v_current_dues, v_pocket_money
  FROM students
  WHERE id = p_student_id;
  
  -- Get previous years dues from snapshots
  SELECT COALESCE(SUM(dues_carried_forward_paise), 0)
  INTO v_previous_dues
  FROM student_year_snapshots
  WHERE student_id = p_student_id;
  
  -- Calculate total (add negative pocket money as dues)
  v_total := v_current_dues + v_previous_dues + LEAST(v_pocket_money, 0);
  
  RETURN GREATEST(v_total, 0);
END;
$$;

-- ============================================================================
-- STEP 4: Create the main query function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_students_for_promotion(
  p_academic_year_id UUID,
  p_standard_id UUID DEFAULT NULL
) RETURNS TABLE (
  student_id UUID,
  roll_number TEXT,
  full_name TEXT,
  standard_id UUID,
  standard_name TEXT,
  annual_fee_paise BIGINT,
  fee_paid_paise BIGINT,
  fee_due_paise BIGINT,
  pocket_money_paise BIGINT,
  total_pending_dues_paise BIGINT,
  promotion_eligible BOOLEAN,
  promotion_hold_reason TEXT,
  last_promoted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.roll_number,
    s.full_name,
    s.standard_id,
    st.standard_name,
    s.annual_fee_paise,
    s.fee_paid_paise,
    (s.annual_fee_paise - s.fee_paid_paise) AS fee_due_paise,
    s.pocket_money_paise,
    calculate_pending_dues(s.id) AS total_pending_dues_paise,
    COALESCE(s.promotion_eligible, TRUE) AS promotion_eligible,
    s.promotion_hold_reason,
    s.last_promoted_at
  FROM students s
  JOIN standards st ON st.id = s.standard_id
  WHERE s.academic_year_id = p_academic_year_id
    AND s.is_deleted = FALSE
    AND s.status = 'active'
    AND (p_standard_id IS NULL OR s.standard_id = p_standard_id)
  ORDER BY st.standard_name, s.roll_number;
END;
$$;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE student_year_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies for student_year_snapshots
CREATE POLICY "Users can view snapshots" ON student_year_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert snapshots" ON student_year_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- Policies for promotion_batches
CREATE POLICY "Users can view batches" ON promotion_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage batches" ON promotion_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- Policies for student_promotion_history
CREATE POLICY "Users can view history" ON student_promotion_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage history" ON student_promotion_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- Policies for fee_adjustments
CREATE POLICY "Users can view adjustments" ON fee_adjustments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage adjustments" ON fee_adjustments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal', 'finance')
    )
  );

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON student_year_snapshots TO authenticated;
GRANT ALL ON promotion_batches TO authenticated;
GRANT ALL ON student_promotion_history TO authenticated;
GRANT ALL ON fee_adjustments TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_pending_dues TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_for_promotion TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Student Promotion System Setup Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Added columns to students, academic_years, standards';
  RAISE NOTICE '✓ Created 4 new tables: student_year_snapshots, promotion_batches, student_promotion_history, fee_adjustments';
  RAISE NOTICE '✓ Created helper function: calculate_pending_dues';
  RAISE NOTICE '✓ Created query function: get_students_for_promotion';
  RAISE NOTICE '✓ Enabled RLS policies';
  RAISE NOTICE '✓ Granted permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Refresh your browser to see students!';
  RAISE NOTICE '========================================';
END $$;
