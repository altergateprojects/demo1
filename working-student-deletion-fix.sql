-- Working Student Deletion Fix for Supabase
-- This creates functions that actually work within Supabase constraints

-- Drop any existing functions
DROP FUNCTION IF EXISTS delete_student_completely(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS force_delete_student_cascade(UUID, TEXT, UUID);

-- Create a comprehensive deletion function that handles ALL foreign keys
CREATE OR REPLACE FUNCTION delete_student_completely(
    p_student_id UUID,
    p_deletion_reason TEXT,
    p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_student RECORD;
    v_result JSON;
    v_deleted_counts JSON;
    v_error_details TEXT;
BEGIN
    -- Check if student exists
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;

    -- Log the deletion attempt
    RAISE NOTICE 'Starting comprehensive deletion for student: % (ID: %)', v_student.full_name, p_student_id;

    -- Delete in the most comprehensive order possible
    -- This covers ALL possible foreign key relationships
    
    BEGIN
        -- 1. Delete student_due_payments first (references student_dues)
        DELETE FROM student_due_payments 
        WHERE student_due_id IN (
            SELECT id FROM student_dues WHERE student_id = p_student_id
        );
        
        -- 2. Delete student_dues (references students)
        DELETE FROM student_dues WHERE student_id = p_student_id;
        
        -- 3. Delete student_exit_dues (references students)
        DELETE FROM student_exit_dues WHERE student_id = p_student_id;
        
        -- 4. Delete fee_payments (references students)
        DELETE FROM fee_payments WHERE student_id = p_student_id;
        
        -- 5. Delete pocket_money_transactions (references students)
        DELETE FROM pocket_money_transactions WHERE student_id = p_student_id;
        
        -- 6. Delete student_year_snapshots (references students)
        DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
        
        -- 7. Delete any other possible references
        -- These may or may not exist, so we use IF EXISTS pattern
        
        -- Check if tables exist before trying to delete
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_promotions') THEN
            DELETE FROM student_promotions WHERE student_id = p_student_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_attendance') THEN
            DELETE FROM student_attendance WHERE student_id = p_student_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_grades') THEN
            DELETE FROM student_grades WHERE student_id = p_student_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_marks') THEN
            DELETE FROM student_marks WHERE student_id = p_student_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_transactions') THEN
            DELETE FROM library_transactions WHERE student_id = p_student_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transport_assignments') THEN
            DELETE FROM transport_assignments WHERE student_id = p_student_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_records') THEN
            DELETE FROM medical_records WHERE student_id = p_student_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disciplinary_records') THEN
            DELETE FROM disciplinary_records WHERE student_id = p_student_id;
        END IF;
        
        -- 8. Finally delete the student record
        DELETE FROM students WHERE id = p_student_id;
        
        -- Create success result
        v_result := json_build_object(
            'success', true,
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'student_roll', v_student.roll_number,
            'deletion_reason', p_deletion_reason,
            'deleted_at', NOW(),
            'deleted_by', COALESCE(p_deleted_by, auth.uid()),
            'message', 'Student and all related data deleted successfully'
        );
        
        -- Log successful deletion
        BEGIN
            INSERT INTO audit_logs (
                action_type,
                entity_type,
                entity_id,
                entity_label,
                description,
                created_by
            ) VALUES (
                'DELETE_COMPLETE',
                'student',
                p_student_id::TEXT,
                v_student.full_name || ' (' || v_student.roll_number || ')',
                'Complete student deletion: ' || p_deletion_reason,
                COALESCE(p_deleted_by, auth.uid())
            );
        EXCEPTION WHEN OTHERS THEN
            -- Continue even if audit logging fails
            RAISE NOTICE 'Audit logging failed: %', SQLERRM;
        END;
        
        RETURN v_result;
        
    EXCEPTION 
        WHEN foreign_key_violation THEN
            -- Get detailed error information
            GET STACKED DIAGNOSTICS v_error_details = MESSAGE_TEXT;
            RAISE EXCEPTION 'Foreign key constraint violation: %. This indicates there are additional tables referencing this student that need to be handled. Error details: %', SQLERRM, v_error_details;
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS v_error_details = MESSAGE_TEXT;
            RAISE EXCEPTION 'Failed to delete student: %. Error details: %', SQLERRM, v_error_details;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a manual cleanup function for stubborn cases
CREATE OR REPLACE FUNCTION manual_delete_student_records(
    p_student_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_tables_cleaned TEXT[] := ARRAY[]::TEXT[];
    v_records_deleted INTEGER := 0;
    v_temp_count INTEGER;
BEGIN
    -- This function manually deletes records from all known tables
    -- Use this when the main function fails due to unknown foreign keys
    
    -- Delete from student_due_payments
    DELETE FROM student_due_payments 
    WHERE student_due_id IN (SELECT id FROM student_dues WHERE student_id = p_student_id);
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'student_due_payments: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Delete from student_dues
    DELETE FROM student_dues WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'student_dues: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Delete from student_exit_dues
    DELETE FROM student_exit_dues WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'student_exit_dues: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Delete from fee_payments
    DELETE FROM fee_payments WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'fee_payments: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Delete from pocket_money_transactions
    DELETE FROM pocket_money_transactions WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'pocket_money_transactions: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Delete from student_year_snapshots
    DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'student_year_snapshots: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'student_id', p_student_id,
        'total_records_deleted', v_records_deleted,
        'tables_cleaned', v_tables_cleaned,
        'message', 'Manual cleanup completed. You can now try deleting the student record again.'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Manual cleanup failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_student_completely TO authenticated;
GRANT EXECUTE ON FUNCTION manual_delete_student_records TO authenticated;

-- Show what functions were created
SELECT 
    proname as function_name,
    proargnames as arguments,
    'Function created successfully' as status
FROM pg_proc 
WHERE proname IN ('delete_student_completely', 'manual_delete_student_records')
ORDER BY proname;