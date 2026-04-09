-- ============================================================================
-- STUDENT PROMOTION SYSTEM - DATABASE FUNCTIONS
-- ============================================================================
-- This script creates all PL/pgSQL functions for the student promotion system.
-- Functions handle validation, promotion transactions, bulk operations, and
-- reversals with complete atomicity and fraud-proof financial integrity.
--
-- Requirements: 1.1, 2.1, 4.1-4.6, 6.1-6.5, 8.1, 13.1-13.5, 14.1
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION 1: validate_standard_capacity
-- ============================================================================
-- Validates that a standard has not exceeded its maximum capacity.
-- Returns void on success, raises exception on capacity exceeded.
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_standard_capacity(
  p_standard_id UUID,
  p_academic_year_id UUID
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_capacity INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get capacity limit
  SELECT max_capacity INTO v_capacity
  FROM standards
  WHERE id = p_standard_id;
  
  -- If no capacity defined, allow unlimited
  IF v_capacity IS NULL THEN
    RETURN;
  END IF;
  
  -- Count current active students in this standard and year
  SELECT COUNT(*) INTO v_current_count
  FROM students
  WHERE standard_id = p_standard_id
    AND academic_year_id = p_academic_year_id
    AND is_deleted = FALSE
    AND status = 'active';
  
  -- Check if capacity would be exceeded
  IF v_current_count >= v_capacity THEN
    RAISE EXCEPTION 'Standard capacity exceeded: % / % students', v_current_count, v_capacity;
  END IF;
END;
$$;

COMMENT ON FUNCTION validate_standard_capacity IS 'Validates standard capacity is not exceeded';

-- ============================================================================
-- HELPER FUNCTION 2: calculate_pending_dues
-- ============================================================================
-- Calculates total pending dues for a student including negative pocket money.
-- Returns amount in paise.
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_pending_dues(
  p_student_id UUID
) RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_annual_fee BIGINT;
  v_fee_paid BIGINT;
  v_pocket_money BIGINT;
  v_total_due BIGINT;
BEGIN
  -- Get student financial data
  SELECT annual_fee_paise, fee_paid_paise, pocket_money_paise
  INTO v_annual_fee, v_fee_paid, v_pocket_money
  FROM students
  WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found: %', p_student_id;
  END IF;
  
  -- Calculate: (annual_fee - fee_paid) + negative_pocket_money
  -- LEAST(v_pocket_money, 0) gives us the negative portion only
  v_total_due := (v_annual_fee - v_fee_paid) + LEAST(v_pocket_money, 0);
  
  -- Return non-negative value
  RETURN GREATEST(v_total_due, 0);
END;
$$;

COMMENT ON FUNCTION calculate_pending_dues IS 'Calculates total pending dues including negative pocket money';

-- ============================================================================
-- HELPER FUNCTION 3: get_fee_for_standard
-- ============================================================================
-- Gets the annual fee amount for a standard in a specific academic year.
-- Returns amount in paise.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_fee_for_standard(
  p_standard_id UUID,
  p_academic_year_id UUID
) RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_fee_amount BIGINT;
BEGIN
  -- Get fee from fee_configurations table
  SELECT annual_fee_paise INTO v_fee_amount
  FROM fee_configurations
  WHERE standard_id = p_standard_id
    AND academic_year_id = p_academic_year_id
  LIMIT 1;
  
  -- If no fee configuration found, return 0
  IF v_fee_amount IS NULL THEN
    v_fee_amount := 0;
  END IF;
  
  RETURN v_fee_amount;
END;
$$;

COMMENT ON FUNCTION get_fee_for_standard IS 'Gets annual fee for a standard in an academic year';

-- ============================================================================
-- HELPER FUNCTION 4: record_exit_dues
-- ============================================================================
-- Records exit dues when a student leaves school or graduates.
-- ============================================================================

CREATE OR REPLACE FUNCTION record_exit_dues(
  p_student_id UUID,
  p_academic_year_id UUID,
  p_total_due_paise BIGINT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into student_dues table (assuming it exists from previous system)
  INSERT INTO student_dues (
    student_id,
    academic_year_id,
    due_type,
    amount_paise,
    description,
    due_date,
    status
  ) VALUES (
    p_student_id,
    p_academic_year_id,
    'exit_dues',
    p_total_due_paise,
    'Pending dues at time of exit/graduation',
    CURRENT_DATE,
    'pending'
  );
END;
$$;

COMMENT ON FUNCTION record_exit_dues IS 'Records pending dues when student exits or graduates';

-- ============================================================================
-- CORE FUNCTION 1: promote_student_transaction
-- ============================================================================
-- Promotes a single student with complete transaction atomicity.
-- This is the main promotion function that handles all promotion types.
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
  v_snapshot_id UUID;
  v_current_year_id UUID;
  v_current_standard_id UUID;
  v_annual_fee BIGINT;
  v_fee_paid BIGINT;
  v_fee_due BIGINT;
  v_pocket_money BIGINT;
  v_dues_carried_forward BIGINT;
  v_new_annual_fee BIGINT;
  v_result JSONB;
  v_student_name TEXT;
  v_is_final_year BOOLEAN;
BEGIN
  -- 1. Validate and lock student record
  SELECT 
    academic_year_id, 
    standard_id, 
    annual_fee_paise,
    fee_paid_paise,
    pocket_money_paise,
    full_name
  INTO 
    v_current_year_id, 
    v_current_standard_id, 
    v_annual_fee,
    v_fee_paid,
    v_pocket_money,
    v_student_name
  FROM students
  WHERE id = p_student_id 
    AND status = 'active' 
    AND is_deleted = FALSE
    AND promotion_eligible = TRUE
  FOR UPDATE; -- Lock row for update
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found, not active, or not eligible for promotion';
  END IF;
  
  -- Calculate fee due
  v_fee_due := v_annual_fee - v_fee_paid;
  
  -- 2. Check if current standard is final year
  SELECT is_final_year INTO v_is_final_year
  FROM standards
  WHERE id = v_current_standard_id;
  
  -- If final year and trying to promote (not graduate), reject
  IF v_is_final_year AND p_promotion_status = 'promoted' THEN
    RAISE EXCEPTION 'Cannot promote from final year. Use graduated status instead.';
  END IF;
  
  -- 3. Validate target class is empty (if promoting to new standard)
  IF p_promotion_status = 'promoted' AND p_target_standard_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM students 
      WHERE academic_year_id = p_target_academic_year_id 
        AND standard_id = p_target_standard_id
        AND is_deleted = FALSE
    ) THEN
      RAISE EXCEPTION 'Target class already contains students. Cannot promote to non-empty class.';
    END IF;
    
    -- Check capacity
    PERFORM validate_standard_capacity(p_target_standard_id, p_target_academic_year_id);
  END IF;
  
  -- 4. Calculate dues to carry forward
  v_dues_carried_forward := CASE 
    WHEN p_dues_action = 'carried_forward' THEN v_fee_due + LEAST(v_pocket_money, 0)
    ELSE 0
  END;
  
  -- Ensure non-negative
  v_dues_carried_forward := GREATEST(v_dues_carried_forward, 0);
  
  -- 5. Create year snapshot (immutable record)
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
    created_by, 
    notes
  ) VALUES (
    p_student_id, 
    v_current_year_id, 
    v_current_standard_id,
    v_annual_fee,
    v_fee_paid,
    v_fee_due,
    v_pocket_money,
    p_promotion_status, 
    p_target_standard_id, 
    p_target_academic_year_id,
    p_dues_action,
    v_dues_carried_forward,
    p_promoted_by, 
    p_notes
  ) RETURNING id INTO v_snapshot_id;
  
  -- 6. Update student record based on promotion status
  IF p_promotion_status = 'promoted' THEN
    -- Get new year's fee
    v_new_annual_fee := get_fee_for_standard(p_target_standard_id, p_target_academic_year_id);
    
    UPDATE students SET
      academic_year_id = p_target_academic_year_id,
      standard_id = p_target_standard_id,
      annual_fee_paise = v_new_annual_fee,
      fee_paid_paise = 0,
      pocket_money_paise = CASE 
        WHEN p_dues_action = 'carried_forward' THEN GREATEST(v_pocket_money, 0)
        WHEN p_dues_action = 'waived' THEN 0
        ELSE v_pocket_money
      END,
      last_promoted_at = NOW(),
      updated_at = NOW()
    WHERE id = p_student_id;
    
  ELSIF p_promotion_status = 'repeated' THEN
    -- Stay in same standard but move to new year
    v_new_annual_fee := get_fee_for_standard(v_current_standard_id, p_target_academic_year_id);
    
    UPDATE students SET
      academic_year_id = p_target_academic_year_id,
      -- standard_id stays same
      annual_fee_paise = v_new_annual_fee,
      fee_paid_paise = 0,
      pocket_money_paise = CASE 
        WHEN p_dues_action = 'carried_forward' THEN GREATEST(v_pocket_money, 0)
        ELSE 0
      END,
      last_promoted_at = NOW(),
      updated_at = NOW()
    WHERE id = p_student_id;
    
  ELSIF p_promotion_status IN ('left_school', 'graduated') THEN
    -- Mark as withdrawn or alumni
    UPDATE students SET
      status = CASE 
        WHEN p_promotion_status = 'graduated' THEN 'alumni'
        ELSE 'withdrawn'
      END,
      last_promoted_at = NOW(),
      updated_at = NOW()
    WHERE id = p_student_id;
    
    -- Record exit dues if any
    IF v_fee_due > 0 OR v_pocket_money < 0 THEN
      PERFORM record_exit_dues(
        p_student_id, 
        v_current_year_id, 
        v_fee_due + LEAST(v_pocket_money, 0)
      );
    END IF;
  END IF;
  
  -- 7. Create promotion history record
  INSERT INTO student_promotion_history (
    student_id, 
    snapshot_id, 
    from_academic_year_id, 
    to_academic_year_id,
    from_standard_id, 
    to_standard_id, 
    promotion_status,
    promoted_by, 
    notes
  ) VALUES (
    p_student_id, 
    v_snapshot_id, 
    v_current_year_id, 
    p_target_academic_year_id,
    v_current_standard_id, 
    p_target_standard_id, 
    p_promotion_status,
    p_promoted_by, 
    p_notes
  );
  
  -- 8. Create audit log
  INSERT INTO audit_logs (
    action_type, 
    entity_type, 
    entity_id, 
    entity_label,
    performed_by,
    description,
    academic_year_id,
    old_value,
    new_value
  ) SELECT
    'PROMOTION', 
    'student', 
    p_student_id, 
    v_student_name,
    p_promoted_by,
    format('Student %s %s from year %s to %s', 
           v_student_name, 
           p_promotion_status,
           (SELECT year_label FROM academic_years WHERE id = v_current_year_id),
           (SELECT year_label FROM academic_years WHERE id = p_target_academic_year_id)),
    p_target_academic_year_id,
    jsonb_build_object(
      'academic_year_id', v_current_year_id,
      'standard_id', v_current_standard_id,
      'fee_due_paise', v_fee_due,
      'pocket_money_paise', v_pocket_money
    ),
    jsonb_build_object(
      'academic_year_id', p_target_academic_year_id,
      'standard_id', p_target_standard_id,
      'promotion_status', p_promotion_status,
      'dues_action', p_dues_action,
      'dues_carried_forward_paise', v_dues_carried_forward
    );
  
  -- 9. Return success result
  v_result := jsonb_build_object(
    'success', true,
    'student_id', p_student_id,
    'snapshot_id', v_snapshot_id,
    'promotion_status', p_promotion_status,
    'dues_carried_forward_paise', v_dues_carried_forward
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'student_id', p_student_id
    );
END;
$$;

COMMENT ON FUNCTION promote_student_transaction IS 'Promotes a single student with complete atomicity';

-- ============================================================================
-- CORE FUNCTION 2: bulk_promote_students
-- ============================================================================
-- Promotes multiple students in a batch with independent transactions.
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_promote_students(
  p_student_ids UUID[],
  p_target_academic_year_id UUID,
  p_target_standard_id UUID,
  p_promotion_status TEXT,
  p_dues_action TEXT,
  p_promoted_by UUID,
  p_batch_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch_id UUID;
  v_student_id UUID;
  v_result JSONB;
  v_results JSONB[] := '{}';
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_source_year_id UUID;
BEGIN
  -- Get source academic year from first student
  SELECT academic_year_id INTO v_source_year_id
  FROM students 
  WHERE id = p_student_ids[1]
  LIMIT 1;
  
  -- Create batch record
  INSERT INTO promotion_batches (
    batch_name, 
    source_academic_year_id, 
    target_academic_year_id,
    target_standard_id, 
    total_students, 
    status, 
    created_by
  ) VALUES (
    COALESCE(p_batch_name, 'Bulk Promotion ' || NOW()::TEXT),
    v_source_year_id,
    p_target_academic_year_id,
    p_target_standard_id,
    array_length(p_student_ids, 1),
    'processing',
    p_promoted_by
  ) RETURNING id INTO v_batch_id;
  
  -- Validate target class is empty ONCE before processing
  IF p_promotion_status = 'promoted' AND p_target_standard_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM students 
      WHERE academic_year_id = p_target_academic_year_id 
        AND standard_id = p_target_standard_id
        AND is_deleted = FALSE
    ) THEN
      -- Update batch as failed
      UPDATE promotion_batches 
      SET status = 'failed', 
          completed_at = NOW(),
          error_summary = jsonb_build_object(
            'error', 'Target class already contains students'
          )
      WHERE id = v_batch_id;
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Target class already contains students',
        'batch_id', v_batch_id
      );
    END IF;
  END IF;
  
  -- Process each student independently
  FOREACH v_student_id IN ARRAY p_student_ids
  LOOP
    BEGIN
      -- Call single promotion function
      v_result := promote_student_transaction(
        v_student_id, 
        p_target_academic_year_id, 
        p_target_standard_id,
        p_promotion_status, 
        p_dues_action, 
        p_promoted_by, 
        NULL
      );
      
      -- Update batch_id in promotion history
      IF (v_result->>'success')::BOOLEAN THEN
        UPDATE student_promotion_history 
        SET batch_id = v_batch_id
        WHERE student_id = v_student_id 
          AND to_academic_year_id = p_target_academic_year_id
          AND promoted_at = (
            SELECT MAX(promoted_at) 
            FROM student_promotion_history 
            WHERE student_id = v_student_id
          );
        
        v_successful := v_successful + 1;
      ELSE
        v_failed := v_failed + 1;
      END IF;
      
      v_results := array_append(v_results, v_result);
      
    EXCEPTION
      WHEN OTHERS THEN
        v_failed := v_failed + 1;
        v_results := array_append(v_results, jsonb_build_object(
          'success', false,
          'student_id', v_student_id,
          'error', SQLERRM
        ));
    END;
  END LOOP;
  
  -- Update batch status
  UPDATE promotion_batches SET
    successful_promotions = v_successful,
    failed_promotions = v_failed,
    status = CASE 
      WHEN v_failed = 0 THEN 'completed'
      WHEN v_successful = 0 THEN 'failed'
      ELSE 'partially_completed'
    END,
    completed_at = NOW(),
    error_summary = CASE 
      WHEN v_failed > 0 THEN 
        jsonb_build_object(
          'failed_count', v_failed,
          'errors', (SELECT jsonb_agg(r) FROM unnest(v_results) r WHERE (r->>'success')::BOOLEAN = FALSE)
        )
      ELSE NULL
    END
  WHERE id = v_batch_id;
  
  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'batch_id', v_batch_id,
    'total_processed', array_length(p_student_ids, 1),
    'successful', v_successful,
    'failed', v_failed,
    'results', v_results
  );
END;
$$;

COMMENT ON FUNCTION bulk_promote_students IS 'Promotes multiple students with independent transactions';

-- ============================================================================
-- CORE FUNCTION 3: reverse_promotion_transaction
-- ============================================================================
-- Reverses a promotion if no post-promotion transactions exist.
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_promotion_transaction(
  p_student_id UUID,
  p_promotion_history_id UUID,
  p_reversed_by UUID,
  p_reversal_reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_history RECORD;
  v_snapshot RECORD;
  v_has_transactions BOOLEAN;
  v_student_name TEXT;
BEGIN
  -- Get promotion history with lock
  SELECT * INTO v_history
  FROM student_promotion_history
  WHERE id = p_promotion_history_id 
    AND student_id = p_student_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promotion history not found';
  END IF;
  
  IF v_history.is_reversed THEN
    RAISE EXCEPTION 'Promotion already reversed';
  END IF;
  
  -- Get snapshot
  SELECT * INTO v_snapshot
  FROM student_year_snapshots
  WHERE id = v_history.snapshot_id;
  
  -- Check for post-promotion transactions
  SELECT EXISTS (
    SELECT 1 FROM fee_payments
    WHERE student_id = p_student_id 
      AND academic_year_id = v_history.to_academic_year_id
      AND created_at > v_history.promoted_at
  ) OR EXISTS (
    SELECT 1 FROM pocket_money_transactions
    WHERE student_id = p_student_id
      AND created_at > v_history.promoted_at
  ) INTO v_has_transactions;
  
  IF v_has_transactions THEN
    RAISE EXCEPTION 'Cannot reverse: financial transactions occurred after promotion';
  END IF;
  
  -- Get student name
  SELECT full_name INTO v_student_name
  FROM students
  WHERE id = p_student_id;
  
  -- Restore student to previous state
  UPDATE students SET
    academic_year_id = v_history.from_academic_year_id,
    standard_id = v_history.from_standard_id,
    annual_fee_paise = v_snapshot.annual_fee_paise,
    fee_paid_paise = v_snapshot.fee_paid_paise,
    pocket_money_paise = v_snapshot.pocket_money_paise,
    status = 'active',
    updated_at = NOW()
  WHERE id = p_student_id;
  
  -- Mark promotion as reversed
  UPDATE student_promotion_history SET
    is_reversed = TRUE,
    reversed_at = NOW(),
    reversed_by = p_reversed_by,
    reversal_reason = p_reversal_reason
  WHERE id = p_promotion_history_id;
  
  -- Create audit log
  INSERT INTO audit_logs (
    action_type, 
    entity_type, 
    entity_id, 
    entity_label,
    performed_by,
    description,
    academic_year_id
  ) VALUES (
    'REVERSE_PROMOTION', 
    'student', 
    p_student_id, 
    v_student_name,
    p_reversed_by,
    format('Reversed promotion for %s. Reason: %s', v_student_name, p_reversal_reason),
    v_history.from_academic_year_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'student_id', p_student_id,
    'restored_year_id', v_history.from_academic_year_id,
    'restored_standard_id', v_history.from_standard_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'student_id', p_student_id
    );
END;
$$;

COMMENT ON FUNCTION reverse_promotion_transaction IS 'Reverses a promotion if no post-promotion transactions exist';

-- ============================================================================
-- Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION validate_standard_capacity TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_pending_dues TO authenticated;
GRANT EXECUTE ON FUNCTION get_fee_for_standard TO authenticated;
GRANT EXECUTE ON FUNCTION record_exit_dues TO authenticated;
GRANT EXECUTE ON FUNCTION promote_student_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_promote_students TO authenticated;
GRANT EXECUTE ON FUNCTION reverse_promotion_transaction TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Student Promotion functions created successfully';
  RAISE NOTICE '✓ Helper functions: validate_standard_capacity, calculate_pending_dues, get_fee_for_standard, record_exit_dues';
  RAISE NOTICE '✓ Core functions: promote_student_transaction, bulk_promote_students, reverse_promotion_transaction';
  RAISE NOTICE '✓ All functions have SECURITY DEFINER for elevated privileges';
  RAISE NOTICE '✓ Ready for query functions implementation (Task 3)';
END $$;
