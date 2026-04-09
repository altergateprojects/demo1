-- Complete Student Deletion System
-- This function permanently removes a student and ALL related data

CREATE OR REPLACE FUNCTION delete_student_completely(
  p_student_id UUID,
  p_deletion_reason TEXT,
  p_deleted_by UUID
) RETURNS JSON AS $$
DECLARE
  v_student RECORD;
  v_deleted_records JSON;
  v_fee_payments_count INTEGER := 0;
  v_student_dues_count INTEGER := 0;
  v_pocket_money_count INTEGER := 0;
  v_snapshots_count INTEGER := 0;
  v_audit_logs_count INTEGER := 0;
BEGIN
  -- Get student info before deletion
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  -- Start transaction for complete deletion
  BEGIN
    -- 1. Delete fee payments
    DELETE FROM fee_payments WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_fee_payments_count = ROW_COUNT;

    -- 2. Delete student dues
    DELETE FROM student_dues WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_student_dues_count = ROW_COUNT;

    -- 3. Delete pocket money transactions
    DELETE FROM pocket_money_transactions WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_pocket_money_count = ROW_COUNT;

    -- 4. Delete year snapshots (promotion history)
    DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_snapshots_count = ROW_COUNT;

    -- 5. Delete audit logs related to this student
    DELETE FROM audit_logs WHERE entity_id = p_student_id::TEXT;
    GET DIAGNOSTICS v_audit_logs_count = ROW_COUNT;

    -- 6. Finally delete the student record
    DELETE FROM students WHERE id = p_student_id;

    -- Create summary of deleted records
    v_deleted_records := json_build_object(
      'student_id', p_student_id,
      'student_name', v_student.full_name,
      'student_roll', v_student.roll_number,
      'deletion_reason', p_deletion_reason,
      'deleted_by', p_deleted_by,
      'deleted_at', NOW(),
      'records_deleted', json_build_object(
        'fee_payments', v_fee_payments_count,
        'student_dues', v_student_dues_count,
        'pocket_money_transactions', v_pocket_money_count,
        'year_snapshots', v_snapshots_count,
        'audit_logs', v_audit_logs_count
      )
    );

    -- Log the complete deletion in a special audit table (if it exists)
    BEGIN
      INSERT INTO audit_logs (
        action_type,
        entity_type,
        entity_id,
        entity_label,
        old_value,
        description,
        created_by
      ) VALUES (
        'DELETE_COMPLETE',
        'student_deletion',
        p_student_id::TEXT,
        v_student.full_name || ' (' || v_student.roll_number || ')',
        v_deleted_records,
        'Complete student deletion: ' || p_deletion_reason,
        p_deleted_by
      );
    EXCEPTION WHEN OTHERS THEN
      -- If audit logging fails, continue with deletion
      NULL;
    END;

    RETURN v_deleted_records;

  EXCEPTION WHEN OTHERS THEN
    -- If any deletion fails, rollback everything
    RAISE EXCEPTION 'Failed to delete student completely: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_student_completely TO authenticated;

-- Create a backup table for deleted students (optional)
CREATE TABLE IF NOT EXISTS deleted_students_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_student_id UUID NOT NULL,
  student_data JSONB NOT NULL,
  deletion_reason TEXT NOT NULL,
  deleted_by UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (deleted_by) REFERENCES auth.users(id)
);

-- Grant permissions on backup table
GRANT SELECT, INSERT ON deleted_students_backup TO authenticated;

-- Create RLS policy for backup table
ALTER TABLE deleted_students_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deleted students backup" ON deleted_students_backup
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Users can insert deleted students backup" ON deleted_students_backup
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'finance')
    )
  );

-- Enhanced function that also creates backup
CREATE OR REPLACE FUNCTION delete_student_with_backup(
  p_student_id UUID,
  p_deletion_reason TEXT,
  p_deleted_by UUID
) RETURNS JSON AS $$
DECLARE
  v_complete_data JSONB;
  v_result JSON;
BEGIN
  -- First, get complete student data for backup
  SELECT json_build_object(
    'student', row_to_json(s.*),
    'fee_payments', COALESCE(
      (SELECT json_agg(fp.*) FROM fee_payments fp WHERE fp.student_id = p_student_id), 
      '[]'::json
    ),
    'student_dues', COALESCE(
      (SELECT json_agg(sd.*) FROM student_dues sd WHERE sd.student_id = p_student_id), 
      '[]'::json
    ),
    'pocket_money_transactions', COALESCE(
      (SELECT json_agg(pmt.*) FROM pocket_money_transactions pmt WHERE pmt.student_id = p_student_id), 
      '[]'::json
    ),
    'year_snapshots', COALESCE(
      (SELECT json_agg(sys.*) FROM student_year_snapshots sys WHERE sys.student_id = p_student_id), 
      '[]'::json
    )
  )::JSONB INTO v_complete_data
  FROM students s
  WHERE s.id = p_student_id;

  -- Create backup record
  INSERT INTO deleted_students_backup (
    original_student_id,
    student_data,
    deletion_reason,
    deleted_by
  ) VALUES (
    p_student_id,
    v_complete_data,
    p_deletion_reason,
    p_deleted_by
  );

  -- Now perform complete deletion
  SELECT delete_student_completely(p_student_id, p_deletion_reason, p_deleted_by) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_student_with_backup TO authenticated;

COMMENT ON FUNCTION delete_student_completely IS 'Permanently deletes a student and all related data';
COMMENT ON FUNCTION delete_student_with_backup IS 'Deletes student with backup - creates backup before deletion';
COMMENT ON TABLE deleted_students_backup IS 'Backup of deleted students data for audit purposes';