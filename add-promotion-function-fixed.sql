-- ============================================================================
-- ADD MISSING PROMOTION FUNCTION - FIXED FOR YOUR DATABASE
-- ============================================================================
-- This version detects the correct column name in your standards table
-- ============================================================================

-- First, ensure the helper function exists
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
  
  -- Get previous years dues from snapshots (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_year_snapshots') THEN
    SELECT COALESCE(SUM(dues_carried_forward_paise), 0)
    INTO v_previous_dues
    FROM student_year_snapshots
    WHERE student_id = p_student_id;
  ELSE
    v_previous_dues := 0;
  END IF;
  
  -- Calculate total (add negative pocket money as dues)
  v_total := v_current_dues + v_previous_dues + LEAST(COALESCE(v_pocket_money, 0), 0);
  
  RETURN GREATEST(v_total, 0);
END;
$$;

-- Now create the main function - using COALESCE to handle both column names
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
DECLARE
  v_has_standard_name BOOLEAN;
  v_query TEXT;
BEGIN
  -- Check which column exists in standards table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'standards' AND column_name = 'standard_name'
  ) INTO v_has_standard_name;
  
  -- Build query based on available columns
  IF v_has_standard_name THEN
    -- Use standard_name column
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
  ELSE
    -- Use name column (fallback)
    RETURN QUERY
    SELECT 
      s.id AS student_id,
      s.roll_number,
      s.full_name,
      s.standard_id,
      st.name AS standard_name,
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
    ORDER BY st.name, s.roll_number;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_pending_dues TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_for_promotion TO authenticated;

-- Test the function
DO $$
DECLARE
  v_current_year_id UUID;
  v_student_count INTEGER;
  v_function_result INTEGER;
BEGIN
  -- Get current year
  SELECT id INTO v_current_year_id
  FROM academic_years
  WHERE is_current = TRUE
  LIMIT 1;
  
  IF v_current_year_id IS NULL THEN
    RAISE NOTICE '⚠ No current academic year found!';
  ELSE
    RAISE NOTICE '✓ Current academic year ID: %', v_current_year_id;
    
    -- Count students directly
    SELECT COUNT(*) INTO v_student_count
    FROM students
    WHERE academic_year_id = v_current_year_id
      AND is_deleted = FALSE
      AND status = 'active';
    
    RAISE NOTICE '✓ Students in current year (direct count): %', v_student_count;
    
    -- Count students from function
    SELECT COUNT(*) INTO v_function_result
    FROM get_students_for_promotion(v_current_year_id, NULL);
    
    RAISE NOTICE '✓ Students returned by function: %', v_function_result;
    
    IF v_function_result > 0 THEN
      RAISE NOTICE '========================================';
      RAISE NOTICE '✓ SUCCESS! Function is working correctly!';
      RAISE NOTICE '✓ Refresh your browser to see students';
      RAISE NOTICE '========================================';
    ELSIF v_student_count > 0 THEN
      RAISE NOTICE '⚠ Function returns 0 students but % exist - checking columns...', v_student_count;
      RAISE NOTICE '⚠ Run check-standards-columns.sql to see column names';
    ELSE
      RAISE NOTICE '⚠ No students found in current year';
    END IF;
  END IF;
END $$;
