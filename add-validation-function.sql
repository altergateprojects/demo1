-- ============================================================================
-- ADD PROMOTION VALIDATION FUNCTION
-- ============================================================================
-- This creates the check_promotion_eligibility function
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
  v_standard_name TEXT;
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
  
  -- Check if promotion eligible (if column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'promotion_eligible'
  ) THEN
    IF NOT COALESCE(v_student.promotion_eligible, TRUE) THEN
      v_eligible := FALSE;
      v_errors := array_append(v_errors, 
        'Student is on promotion hold: ' || COALESCE(v_student.promotion_hold_reason, 'No reason specified'));
    END IF;
  END IF;
  
  -- Check if target standard exists and get details
  IF p_target_standard_id IS NOT NULL THEN
    -- Dynamically get the name column (handle both 'name' and 'standard_name')
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'standards' AND column_name = 'standard_name'
    ) THEN
      SELECT 
        COALESCE(max_capacity, 999999),
        COALESCE(is_final_year, FALSE),
        standard_name
      INTO v_capacity, v_is_final_year, v_standard_name
      FROM standards
      WHERE id = p_target_standard_id;
    ELSE
      SELECT 
        COALESCE(max_capacity, 999999),
        COALESCE(is_final_year, FALSE),
        name
      INTO v_capacity, v_is_final_year, v_standard_name
      FROM standards
      WHERE id = p_target_standard_id;
    END IF;
    
    IF NOT FOUND THEN
      v_eligible := FALSE;
      v_errors := array_append(v_errors, 'Target standard not found');
    END IF;
    
    -- Check if target class is empty (class mixing prevention)
    SELECT COUNT(*) INTO v_target_count
    FROM students
    WHERE academic_year_id = p_target_academic_year_id
      AND standard_id = p_target_standard_id
      AND is_deleted = FALSE;
    
    IF v_target_count > 0 THEN
      v_eligible := FALSE;
      v_errors := array_append(v_errors, 
        format('Target class already has %s students. Cannot promote to non-empty class (class mixing prevention).', v_target_count));
    END IF;
    
    -- Check capacity
    IF v_target_count >= v_capacity THEN
      v_eligible := FALSE;
      v_errors := array_append(v_errors, 
        format('Target class capacity exceeded: %s / %s', v_target_count, v_capacity));
    END IF;
  END IF;
  
  -- Check for pending dues (warning only)
  IF (v_student.annual_fee_paise - v_student.fee_paid_paise) > 0 THEN
    v_warnings := array_append(v_warnings, 
      'Student has pending fee dues: ₹' || 
      ROUND((v_student.annual_fee_paise - v_student.fee_paid_paise)::DECIMAL / 100, 2)::TEXT);
  END IF;
  
  IF v_student.pocket_money_paise < 0 THEN
    v_warnings := array_append(v_warnings, 
      'Student has negative pocket money: ₹' || 
      ROUND(v_student.pocket_money_paise::DECIMAL / 100, 2)::TEXT);
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_promotion_eligibility TO authenticated;

-- Test the function
DO $$
DECLARE
  v_test_student_id UUID;
  v_test_standard_id UUID;
  v_test_year_id UUID;
  v_result JSONB;
BEGIN
  -- Get a test student
  SELECT id INTO v_test_student_id
  FROM students
  WHERE is_deleted = FALSE AND status = 'active'
  LIMIT 1;
  
  IF v_test_student_id IS NOT NULL THEN
    -- Get a standard
    SELECT id INTO v_test_standard_id
    FROM standards
    LIMIT 1;
    
    -- Get next year
    SELECT id INTO v_test_year_id
    FROM academic_years
    WHERE is_current = FALSE
    ORDER BY start_date DESC
    LIMIT 1;
    
    IF v_test_standard_id IS NOT NULL AND v_test_year_id IS NOT NULL THEN
      -- Test the function
      SELECT check_promotion_eligibility(
        v_test_student_id,
        v_test_standard_id,
        v_test_year_id
      ) INTO v_result;
      
      RAISE NOTICE '========================================';
      RAISE NOTICE '✓ Validation function created successfully!';
      RAISE NOTICE '✓ Test result: %', v_result;
      RAISE NOTICE '========================================';
    END IF;
  END IF;
END $$;
