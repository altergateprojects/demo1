-- Add Bulk Promotion Function
-- This script creates the bulk_promote_students function

-- ============================================================================
-- CORE FUNCTION: bulk_promote_students
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION bulk_promote_students TO authenticated;

-- Test the function exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'bulk_promote_students';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ bulk_promote_students function created successfully';
  RAISE NOTICE '✓ Function accepts: student_ids[], target_year_id, target_standard_id, status, dues_action, promoted_by, batch_name';
  RAISE NOTICE '✓ Returns: JSONB with success status, batch_id, and results';
END $$;
