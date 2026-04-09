-- ============================================================================
-- STUDENT PROMOTION SYSTEM - QUERY AND REPORTING FUNCTIONS
-- ============================================================================
-- This script creates query functions for retrieving promotion history,
-- financial summaries, and dashboard data.
--
-- Requirements: 5.1, 5.4, 10.4, 18.1, 18.2, 18.3, 18.4
-- ============================================================================

-- ============================================================================
-- QUERY FUNCTION 1: get_student_financial_summary
-- ============================================================================
-- Returns complete financial summary for a student across all years.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_financial_summary(
  p_student_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_current_year_dues BIGINT;
  v_previous_years_dues BIGINT;
  v_total_paid BIGINT;
  v_pocket_money BIGINT;
BEGIN
  -- Calculate current year dues
  v_current_year_dues := calculate_pending_dues(p_student_id);
  
  -- Sum previous years dues from snapshots
  SELECT COALESCE(SUM(dues_carried_forward_paise), 0)
  INTO v_previous_years_dues
  FROM student_year_snapshots
  WHERE student_id = p_student_id;
  
  -- Sum total paid from fee_payments
  SELECT COALESCE(SUM(amount_paise), 0)
  INTO v_total_paid
  FROM fee_payments
  WHERE student_id = p_student_id;
  
  -- Get current pocket money balance
  SELECT pocket_money_paise
  INTO v_pocket_money
  FROM students
  WHERE id = p_student_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'student_id', p_student_id,
    'current_year_dues_paise', v_current_year_dues,
    'previous_years_dues_paise', v_previous_years_dues,
    'total_paid_paise', v_total_paid,
    'pocket_money_paise', COALESCE(v_pocket_money, 0),
    'total_pending_paise', v_current_year_dues + v_previous_years_dues
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_student_financial_summary IS 'Returns complete financial summary for a student';

-- ============================================================================
-- QUERY FUNCTION 2: get_dashboard_dues_summary
-- ============================================================================
-- Returns aggregated dues summary for dashboard display.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_dues_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_current_year_id UUID;
  v_current_year_dues BIGINT;
  v_previous_years_dues BIGINT;
  v_exit_dues BIGINT;
  v_total_pending BIGINT;
  v_negative_pocket_money BIGINT;
  v_negative_pocket_count INTEGER;
BEGIN
  -- Get current academic year
  SELECT id INTO v_current_year_id
  FROM academic_years
  WHERE is_current = TRUE
  LIMIT 1;
  
  -- Calculate current year dues (fee dues + negative pocket money)
  SELECT 
    COALESCE(SUM(
      GREATEST(annual_fee_paise - fee_paid_paise, 0) + 
      LEAST(pocket_money_paise, 0)
    ), 0)
  INTO v_current_year_dues
  FROM students
  WHERE academic_year_id = v_current_year_id
    AND is_deleted = FALSE
    AND status = 'active';
  
  -- Calculate previous years dues from snapshots
  SELECT COALESCE(SUM(dues_carried_forward_paise), 0)
  INTO v_previous_years_dues
  FROM student_year_snapshots
  WHERE academic_year_id != v_current_year_id;
  
  -- Calculate exit dues (from student_dues table)
  SELECT COALESCE(SUM(amount_paise), 0)
  INTO v_exit_dues
  FROM student_dues
  WHERE due_type = 'exit_dues'
    AND status = 'pending';
  
  -- Calculate negative pocket money separately for display
  SELECT 
    COALESCE(SUM(ABS(pocket_money_paise)), 0),
    COUNT(*)
  INTO v_negative_pocket_money, v_negative_pocket_count
  FROM students
  WHERE pocket_money_paise < 0
    AND is_deleted = FALSE
    AND status = 'active';
  
  -- Calculate total
  v_total_pending := v_current_year_dues + v_previous_years_dues + v_exit_dues;
  
  -- Build result
  v_result := jsonb_build_object(
    'current_year_dues_paise', v_current_year_dues,
    'previous_years_dues_paise', v_previous_years_dues,
    'exit_dues_paise', v_exit_dues,
    'total_pending_paise', v_total_pending,
    'negative_pocket_money_paise', v_negative_pocket_money,
    'negative_pocket_money_count', v_negative_pocket_count,
    'current_academic_year_id', v_current_year_id,
    'generated_at', NOW()
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_dashboard_dues_summary IS 'Returns aggregated dues summary for dashboard';

-- ============================================================================
-- QUERY FUNCTION 3: get_promotion_history
-- ============================================================================
-- Returns complete promotion history for a student with financial details.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_promotion_history(
  p_student_id UUID
) RETURNS TABLE (
  history_id UUID,
  snapshot_id UUID,
  batch_id UUID,
  from_year_label TEXT,
  to_year_label TEXT,
  from_standard_name TEXT,
  to_standard_name TEXT,
  promotion_status TEXT,
  annual_fee_paise BIGINT,
  fee_paid_paise BIGINT,
  fee_due_paise BIGINT,
  pocket_money_paise BIGINT,
  dues_action TEXT,
  dues_carried_forward_paise BIGINT,
  is_reversed BOOLEAN,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  promoted_at TIMESTAMPTZ,
  promoted_by_name TEXT,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.id AS history_id,
    ph.snapshot_id,
    ph.batch_id,
    ay1.year_label AS from_year_label,
    ay2.year_label AS to_year_label,
    s1.standard_name AS from_standard_name,
    s2.standard_name AS to_standard_name,
    ph.promotion_status,
    snap.annual_fee_paise,
    snap.fee_paid_paise,
    snap.fee_due_paise,
    snap.pocket_money_paise,
    snap.dues_action,
    snap.dues_carried_forward_paise,
    ph.is_reversed,
    ph.reversed_at,
    ph.reversal_reason,
    ph.promoted_at,
    up.full_name AS promoted_by_name,
    ph.notes
  FROM student_promotion_history ph
  JOIN student_year_snapshots snap ON snap.id = ph.snapshot_id
  JOIN academic_years ay1 ON ay1.id = ph.from_academic_year_id
  JOIN academic_years ay2 ON ay2.id = ph.to_academic_year_id
  JOIN standards s1 ON s1.id = ph.from_standard_id
  LEFT JOIN standards s2 ON s2.id = ph.to_standard_id
  LEFT JOIN user_profiles up ON up.id = ph.promoted_by
  WHERE ph.student_id = p_student_id
  ORDER BY ph.promoted_at DESC;
END;
$$;

COMMENT ON FUNCTION get_promotion_history IS 'Returns complete promotion history for a student';

-- ============================================================================
-- QUERY FUNCTION 4: get_students_for_promotion
-- ============================================================================
-- Returns list of students eligible for promotion with financial details.
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
    s.promotion_eligible,
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

COMMENT ON FUNCTION get_students_for_promotion IS 'Returns students eligible for promotion';

-- ============================================================================
-- QUERY FUNCTION 5: get_promotion_batch_details
-- ============================================================================
-- Returns detailed results for a promotion batch.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_promotion_batch_details(
  p_batch_id UUID
) RETURNS TABLE (
  batch_id UUID,
  batch_name TEXT,
  source_year_label TEXT,
  target_year_label TEXT,
  target_standard_name TEXT,
  total_students INTEGER,
  successful_promotions INTEGER,
  failed_promotions INTEGER,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by_name TEXT,
  student_id UUID,
  student_name TEXT,
  promotion_status TEXT,
  is_reversed BOOLEAN,
  promoted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id AS batch_id,
    pb.batch_name,
    ay1.year_label AS source_year_label,
    ay2.year_label AS target_year_label,
    st.standard_name AS target_standard_name,
    pb.total_students,
    pb.successful_promotions,
    pb.failed_promotions,
    pb.status,
    pb.started_at,
    pb.completed_at,
    up.full_name AS created_by_name,
    ph.student_id,
    s.full_name AS student_name,
    ph.promotion_status,
    ph.is_reversed,
    ph.promoted_at
  FROM promotion_batches pb
  JOIN academic_years ay1 ON ay1.id = pb.source_academic_year_id
  JOIN academic_years ay2 ON ay2.id = pb.target_academic_year_id
  LEFT JOIN standards st ON st.id = pb.target_standard_id
  LEFT JOIN user_profiles up ON up.id = pb.created_by
  LEFT JOIN student_promotion_history ph ON ph.batch_id = pb.id
  LEFT JOIN students s ON s.id = ph.student_id
  WHERE pb.id = p_batch_id
  ORDER BY ph.promoted_at;
END;
$$;

COMMENT ON FUNCTION get_promotion_batch_details IS 'Returns detailed results for a promotion batch';

-- ============================================================================
-- QUERY FUNCTION 6: get_year_wise_financial_history
-- ============================================================================
-- Returns year-wise financial breakdown for a student.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_year_wise_financial_history(
  p_student_id UUID
) RETURNS TABLE (
  academic_year_id UUID,
  year_label TEXT,
  standard_name TEXT,
  annual_fee_paise BIGINT,
  fee_paid_paise BIGINT,
  fee_due_paise BIGINT,
  pocket_money_paise BIGINT,
  dues_carried_forward_paise BIGINT,
  promotion_status TEXT,
  snapshot_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    snap.academic_year_id,
    ay.year_label,
    st.standard_name,
    snap.annual_fee_paise,
    snap.fee_paid_paise,
    snap.fee_due_paise,
    snap.pocket_money_paise,
    snap.dues_carried_forward_paise,
    snap.promotion_status,
    snap.snapshot_date
  FROM student_year_snapshots snap
  JOIN academic_years ay ON ay.id = snap.academic_year_id
  JOIN standards st ON st.id = snap.standard_id
  WHERE snap.student_id = p_student_id
  ORDER BY ay.start_date DESC;
END;
$$;

COMMENT ON FUNCTION get_year_wise_financial_history IS 'Returns year-wise financial breakdown';

-- ============================================================================
-- QUERY FUNCTION 7: check_promotion_eligibility
-- ============================================================================
-- Checks if a student can be promoted and returns validation results.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_promotion_eligibility(
  p_student_id UUID,
  p_target_standard_id UUID,
  p_target_academic_year_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_eligible BOOLEAN := TRUE;
  v_warnings TEXT[] := '{}';
  v_errors TEXT[] := '{}';
  v_student RECORD;
  v_target_count INTEGER;
  v_capacity INTEGER;
  v_is_final_year BOOLEAN;
BEGIN
  -- Get student details
  SELECT * INTO v_student
  FROM students
  WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    v_eligible := FALSE;
    v_errors := array_append(v_errors, 'Student not found');
    
    RETURN jsonb_build_object(
      'eligible', v_eligible,
      'warnings', v_warnings,
      'errors', v_errors
    );
  END IF;
  
  -- Check if student is active
  IF v_student.status != 'active' THEN
    v_eligible := FALSE;
    v_errors := array_append(v_errors, 'Student is not active');
  END IF;
  
  -- Check if promotion eligible
  IF NOT v_student.promotion_eligible THEN
    v_eligible := FALSE;
    v_errors := array_append(v_errors, 
      'Student is on promotion hold: ' || COALESCE(v_student.promotion_hold_reason, 'No reason specified'));
  END IF;
  
  -- Check if current standard is final year
  SELECT is_final_year INTO v_is_final_year
  FROM standards
  WHERE id = v_student.standard_id;
  
  IF v_is_final_year AND p_target_standard_id IS NOT NULL THEN
    v_eligible := FALSE;
    v_errors := array_append(v_errors, 'Cannot promote from final year. Student should graduate.');
  END IF;
  
  -- Check if target class is empty
  SELECT COUNT(*) INTO v_target_count
  FROM students
  WHERE academic_year_id = p_target_academic_year_id
    AND standard_id = p_target_standard_id
    AND is_deleted = FALSE;
  
  IF v_target_count > 0 THEN
    v_eligible := FALSE;
    v_errors := array_append(v_errors, 
      format('Target class already has %s students. Cannot promote to non-empty class.', v_target_count));
  END IF;
  
  -- Check capacity
  SELECT max_capacity INTO v_capacity
  FROM standards
  WHERE id = p_target_standard_id;
  
  IF v_capacity IS NOT NULL AND v_target_count >= v_capacity THEN
    v_eligible := FALSE;
    v_errors := array_append(v_errors, 
      format('Target class capacity exceeded: %s / %s', v_target_count, v_capacity));
  END IF;
  
  -- Check for pending dues (warning only)
  IF (v_student.annual_fee_paise - v_student.fee_paid_paise) > 0 THEN
    v_warnings := array_append(v_warnings, 
      format('Student has pending fee dues: ₹%.2f', 
        (v_student.annual_fee_paise - v_student.fee_paid_paise)::DECIMAL / 100));
  END IF;
  
  IF v_student.pocket_money_paise < 0 THEN
    v_warnings := array_append(v_warnings, 
      format('Student has negative pocket money: ₹%.2f', 
        v_student.pocket_money_paise::DECIMAL / 100));
  END IF;
  
  -- Build result
  v_result := jsonb_build_object(
    'eligible', v_eligible,
    'warnings', v_warnings,
    'errors', v_errors,
    'student_id', p_student_id,
    'current_standard_id', v_student.standard_id,
    'target_standard_id', p_target_standard_id,
    'pending_dues_paise', calculate_pending_dues(p_student_id)
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION check_promotion_eligibility IS 'Checks promotion eligibility and returns validation results';

-- ============================================================================
-- Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_student_financial_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_dues_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_for_promotion TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_batch_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_year_wise_financial_history TO authenticated;
GRANT EXECUTE ON FUNCTION check_promotion_eligibility TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Student Promotion query functions created successfully';
  RAISE NOTICE '✓ Financial summary functions: get_student_financial_summary, get_dashboard_dues_summary';
  RAISE NOTICE '✓ History functions: get_promotion_history, get_year_wise_financial_history';
  RAISE NOTICE '✓ Utility functions: get_students_for_promotion, check_promotion_eligibility, get_promotion_batch_details';
  RAISE NOTICE '✓ Phase 1 (Database Setup) complete!';
  RAISE NOTICE '✓ Ready for Phase 2 (API Layer)';
END $$;
