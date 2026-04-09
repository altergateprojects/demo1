-- ============================================================================
-- ADD PROMOTION TRANSACTION FUNCTION
-- ============================================================================
-- This creates the promote_student_transaction function that actually
-- performs the student promotion with all financial tracking
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_student_transaction(
  p_student_id UUID,
  p_target_academic_year_id UUID,
  p_target_standard_id UUID,
  p_promotion_status TEXT,
  p_dues_action TEXT,
  p_promoted_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_student RECORD;
  v_snapshot_id UUID;
  v_dues_carried_forward BIGINT := 0;
  v_success BOOLEAN := TRUE;
  v_error TEXT;
BEGIN
  -- Start transaction
  BEGIN
    -- Get current student data
    SELECT * INTO v_student
    FROM students
    WHERE id = p_student_id
    FOR UPDATE; -- Lock the row
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Student not found'
      );
    END IF;
    
    -- Calculate dues to carry forward
    IF p_dues_action = 'carried_forward' THEN
      v_dues_carried_forward := calculate_pending_dues(p_student_id);
    ELSIF p_dues_action = 'waived' THEN
      v_dues_carried_forward := 0;
    ELSIF p_dues_action = 'paid_before_promotion' THEN
      v_dues_carried_forward := 0;
    END IF;
    
    -- Create year snapshot (immutable audit trail)
    INSERT INTO student_year_snapshots (
      student_id,
      academic_year_id,
      standard_id,
      annual_fee_paise,
      fee_paid_paise,
      fee_due_paise,
      pocket_money_paise,
      promotion_status,
      promoted_to_standard_id,
      promoted_to_academic_year_id,
      dues_action,
      dues_carried_forward_paise,
      snapshot_date,
      created_by,
      notes
    ) VALUES (
      p_student_id,
      v_student.academic_year_id,
      v_student.standard_id,
      v_student.annual_fee_paise,
      v_student.fee_paid_paise,
      v_student.annual_fee_paise - v_student.fee_paid_paise,
      v_student.pocket_money_paise,
      p_promotion_status,
      p_target_standard_id,
      p_target_academic_year_id,
      p_dues_action,
      v_dues_carried_forward,
      NOW(),
      p_promoted_by,
      p_notes
    ) RETURNING id INTO v_snapshot_id;
    
    -- Create promotion history record
    INSERT INTO student_promotion_history (
      student_id,
      snapshot_id,
      from_academic_year_id,
      to_academic_year_id,
      from_standard_id,
      to_standard_id,
      promotion_status,
      promoted_at,
      promoted_by,
      notes
    ) VALUES (
      p_student_id,
      v_snapshot_id,
      v_student.academic_year_id,
      p_target_academic_year_id,
      v_student.standard_id,
      p_target_standard_id,
      p_promotion_status,
      NOW(),
      p_promoted_by,
      p_notes
    );
    
    -- Update student record
    UPDATE students
    SET 
      academic_year_id = p_target_academic_year_id,
      standard_id = COALESCE(p_target_standard_id, standard_id),
      -- Reset fees for new year
      annual_fee_paise = 0,
      fee_paid_paise = 0,
      -- Keep pocket money as is (negative pocket money carries forward)
      last_promoted_at = NOW(),
      updated_at = NOW()
    WHERE id = p_student_id;
    
    -- If student left or graduated, mark as inactive
    IF p_promotion_status IN ('left_school', 'graduated') THEN
      UPDATE students
      SET status = 'inactive'
      WHERE id = p_student_id;
    END IF;
    
    -- Build success result
    v_result := jsonb_build_object(
      'success', TRUE,
      'student_id', p_student_id,
      'snapshot_id', v_snapshot_id,
      'dues_carried_forward_paise', v_dues_carried_forward
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically
    v_error := SQLERRM;
    RETURN jsonb_build_object(
      'success', FALSE,
      'student_id', p_student_id,
      'error', v_error
    );
  END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION promote_student_transaction TO authenticated;

-- Test message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Promotion transaction function created!';
  RAISE NOTICE '✓ Function: promote_student_transaction';
  RAISE NOTICE '✓ Ready to promote students';
  RAISE NOTICE '========================================';
END $$;
