-- ============================================================================
-- STUDENT PROMOTION SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This script creates all tables, indexes, and constraints for the student
-- promotion system. It handles academic year transitions with complete
-- financial integrity and audit trails.
--
-- Requirements: 1.1, 2.1, 2.2, 2.5, 2.6, 3.1, 5.1, 6.1, 8.4, 9.1, 13.1, 14.1, 15.1, 16.1
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: student_year_snapshots
-- ============================================================================
-- Stores immutable snapshot of student's financial state at end of each
-- academic year. This preserves complete history for audit purposes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_year_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE RESTRICT,
  
  -- Financial snapshot (all amounts in paise)
  annual_fee_paise BIGINT NOT NULL,
  fee_paid_paise BIGINT NOT NULL,
  fee_due_paise BIGINT NOT NULL, -- Calculated: annual - paid
  pocket_money_paise BIGINT NOT NULL,
  
  -- Promotion details
  promotion_status TEXT NOT NULL CHECK (promotion_status IN 
    ('promoted', 'repeated', 'left_school', 'graduated')),
  promoted_to_standard_id UUID REFERENCES standards(id),
  promoted_to_academic_year_id UUID REFERENCES academic_years(id),
  
  -- Dues handling
  dues_action TEXT NOT NULL CHECK (dues_action IN 
    ('carried_forward', 'waived', 'paid_before_promotion', 'exit_recorded')),
  dues_carried_forward_paise BIGINT NOT NULL DEFAULT 0,
  
  -- Metadata
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  
  -- Constraints
  UNIQUE (student_id, academic_year_id),
  CHECK (fee_due_paise >= 0),
  CHECK (dues_carried_forward_paise >= 0),
  CHECK (annual_fee_paise >= 0),
  CHECK (fee_paid_paise >= 0)
);

-- Indexes for student_year_snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_student 
  ON student_year_snapshots(student_id, academic_year_id DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_year 
  ON student_year_snapshots(academic_year_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_status 
  ON student_year_snapshots(promotion_status);

-- Covering index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_snapshots_dues_summary 
  ON student_year_snapshots(academic_year_id, promotion_status) 
  INCLUDE (fee_due_paise, pocket_money_paise, dues_carried_forward_paise);

-- Index for financial history queries
CREATE INDEX IF NOT EXISTS idx_snapshots_student_financial 
  ON student_year_snapshots(student_id, academic_year_id) 
  INCLUDE (fee_due_paise, pocket_money_paise, dues_carried_forward_paise);

COMMENT ON TABLE student_year_snapshots IS 'Immutable snapshots of student financial state at end of each academic year';
COMMENT ON COLUMN student_year_snapshots.fee_due_paise IS 'Calculated as annual_fee_paise - fee_paid_paise';
COMMENT ON COLUMN student_year_snapshots.dues_carried_forward_paise IS 'Amount carried forward to next year (includes negative pocket money)';

-- ============================================================================
-- TABLE 2: promotion_batches
-- ============================================================================
-- Tracks bulk promotion operations for auditing and rollback capabilities.
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotion_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name TEXT NOT NULL,
  source_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  target_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  target_standard_id UUID REFERENCES standards(id), -- NULL for mixed promotions
  
  -- Statistics
  total_students INTEGER NOT NULL,
  successful_promotions INTEGER NOT NULL DEFAULT 0,
  failed_promotions INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN 
    ('pending', 'processing', 'completed', 'failed', 'partially_completed')),
  
  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  error_summary JSONB,
  
  CHECK (successful_promotions + failed_promotions <= total_students),
  CHECK (successful_promotions >= 0),
  CHECK (failed_promotions >= 0),
  CHECK (total_students > 0)
);

-- Indexes for promotion_batches
CREATE INDEX IF NOT EXISTS idx_batches_year 
  ON promotion_batches(target_academic_year_id);

CREATE INDEX IF NOT EXISTS idx_batches_status 
  ON promotion_batches(status);

CREATE INDEX IF NOT EXISTS idx_batches_created 
  ON promotion_batches(started_at DESC);

COMMENT ON TABLE promotion_batches IS 'Tracks bulk promotion operations with success/failure statistics';
COMMENT ON COLUMN promotion_batches.error_summary IS 'JSONB array of error details for failed promotions';

-- ============================================================================
-- TABLE 3: student_promotion_history
-- ============================================================================
-- Detailed log of each promotion action with reversal tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_promotion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  snapshot_id UUID NOT NULL REFERENCES student_year_snapshots(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES promotion_batches(id) ON DELETE SET NULL,
  
  -- Promotion details
  from_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  to_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  from_standard_id UUID NOT NULL REFERENCES standards(id),
  to_standard_id UUID REFERENCES standards(id), -- NULL for left_school/graduated
  
  promotion_status TEXT NOT NULL CHECK (promotion_status IN 
    ('promoted', 'repeated', 'left_school', 'graduated')),
  
  -- Reversal tracking
  is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES auth.users(id),
  reversal_reason TEXT,
  
  -- Metadata
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  promoted_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  
  UNIQUE (student_id, from_academic_year_id),
  CHECK (is_reversed = FALSE OR (reversed_at IS NOT NULL AND reversed_by IS NOT NULL))
);

-- Indexes for student_promotion_history
CREATE INDEX IF NOT EXISTS idx_promo_history_student 
  ON student_promotion_history(student_id, promoted_at DESC);

CREATE INDEX IF NOT EXISTS idx_promo_history_batch 
  ON student_promotion_history(batch_id);

CREATE INDEX IF NOT EXISTS idx_promo_history_reversed 
  ON student_promotion_history(is_reversed);

CREATE INDEX IF NOT EXISTS idx_promo_history_years 
  ON student_promotion_history(from_academic_year_id, to_academic_year_id);

COMMENT ON TABLE student_promotion_history IS 'Complete history of all student promotions with reversal capability';
COMMENT ON COLUMN student_promotion_history.is_reversed IS 'TRUE if this promotion was reversed (undone)';

-- ============================================================================
-- TABLE 4: fee_adjustments
-- ============================================================================
-- Tracks fee waivers, scholarships, sibling discounts, and other adjustments.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fee_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN 
    ('scholarship', 'sibling_discount', 'fee_waiver', 'pro_rated', 'other')),
  
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  percentage DECIMAL(5,2), -- For percentage-based adjustments
  
  reason TEXT NOT NULL,
  approved_by UUID NOT NULL REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Validity period
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  notes TEXT,
  
  CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

-- Indexes for fee_adjustments
CREATE INDEX IF NOT EXISTS idx_adjustments_student 
  ON fee_adjustments(student_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_adjustments_type 
  ON fee_adjustments(adjustment_type);

CREATE INDEX IF NOT EXISTS idx_adjustments_active 
  ON fee_adjustments(is_active, valid_from, valid_until);

COMMENT ON TABLE fee_adjustments IS 'Fee adjustments including scholarships, waivers, and discounts';
COMMENT ON COLUMN fee_adjustments.percentage IS 'Percentage discount (0-100) for percentage-based adjustments';

-- ============================================================================
-- MODIFY EXISTING TABLES
-- ============================================================================

-- Add columns to students table
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS last_promoted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promotion_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS promotion_hold_reason TEXT;

COMMENT ON COLUMN students.last_promoted_at IS 'Timestamp of last promotion operation';
COMMENT ON COLUMN students.promotion_eligible IS 'FALSE if student is on hold from promotion';
COMMENT ON COLUMN students.promotion_hold_reason IS 'Reason why promotion is on hold (if applicable)';

-- Add columns to academic_years table
ALTER TABLE academic_years 
  ADD COLUMN IF NOT EXISTS promotion_start_date DATE,
  ADD COLUMN IF NOT EXISTS promotion_end_date DATE,
  ADD COLUMN IF NOT EXISTS promotion_locked BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN academic_years.promotion_start_date IS 'Start date of promotion period';
COMMENT ON COLUMN academic_years.promotion_end_date IS 'End date of promotion period';
COMMENT ON COLUMN academic_years.promotion_locked IS 'TRUE if promotions are locked for this year';

-- Add columns to standards table
ALTER TABLE standards 
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS is_final_year BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN standards.max_capacity IS 'Maximum number of students allowed in this standard';
COMMENT ON COLUMN standards.is_final_year IS 'TRUE if this is the final year (graduation year)';

-- ============================================================================
-- COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding promotable students
CREATE INDEX IF NOT EXISTS idx_students_promotion_eligible 
  ON students(promotion_eligible, academic_year_id, standard_id) 
  WHERE is_deleted = FALSE AND status = 'active';

-- Index for student queries by year and standard
CREATE INDEX IF NOT EXISTS idx_students_year_standard_status 
  ON students(academic_year_id, standard_id, status) 
  WHERE is_deleted = FALSE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE student_year_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_year_snapshots
CREATE POLICY "Users can view snapshots" ON student_year_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can insert snapshots" ON student_year_snapshots
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'finance', 'principal')
    )
  );

-- Prevent updates and deletes (immutable)
CREATE POLICY "No updates allowed" ON student_year_snapshots
  FOR UPDATE USING (FALSE);

CREATE POLICY "No deletes allowed" ON student_year_snapshots
  FOR DELETE USING (FALSE);

-- RLS Policies for promotion_batches
CREATE POLICY "Users can view batches" ON promotion_batches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can create batches" ON promotion_batches
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'finance', 'principal')
    )
  );

CREATE POLICY "Authorized users can update batches" ON promotion_batches
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'finance', 'principal')
    )
  );

-- RLS Policies for student_promotion_history
CREATE POLICY "Users can view promotion history" ON student_promotion_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can insert history" ON student_promotion_history
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'finance', 'principal')
    )
  );

CREATE POLICY "Authorized users can update history" ON student_promotion_history
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'finance', 'principal')
    )
  );

-- Prevent deletes (immutable)
CREATE POLICY "No deletes allowed on history" ON student_promotion_history
  FOR DELETE USING (FALSE);

-- RLS Policies for fee_adjustments
CREATE POLICY "Users can view adjustments" ON fee_adjustments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage adjustments" ON fee_adjustments
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'finance', 'principal')
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on tables to authenticated users
GRANT SELECT ON student_year_snapshots TO authenticated;
GRANT SELECT ON promotion_batches TO authenticated;
GRANT SELECT ON student_promotion_history TO authenticated;
GRANT SELECT ON fee_adjustments TO authenticated;

-- Grant insert/update to service role (for functions)
GRANT ALL ON student_year_snapshots TO service_role;
GRANT ALL ON promotion_batches TO service_role;
GRANT ALL ON student_promotion_history TO service_role;
GRANT ALL ON fee_adjustments TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify table creation
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('student_year_snapshots', 'promotion_batches', 'student_promotion_history', 'fee_adjustments');

-- Uncomment to verify indexes
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('student_year_snapshots', 'promotion_batches', 'student_promotion_history', 'fee_adjustments');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Student Promotion System schema created successfully';
  RAISE NOTICE '✓ Created 4 new tables: student_year_snapshots, promotion_batches, student_promotion_history, fee_adjustments';
  RAISE NOTICE '✓ Modified 3 existing tables: students, academic_years, standards';
  RAISE NOTICE '✓ Created 15+ indexes for performance';
  RAISE NOTICE '✓ Enabled RLS policies for data security';
  RAISE NOTICE '✓ Ready for database functions implementation';
END $$;
