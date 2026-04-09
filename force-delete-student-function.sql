-- Force Delete Student Function
-- This handles ALL foreign key constraints by deleting in the correct order

DROP FUNCTION IF EXISTS delete_student_completely(UUID, TEXT, UUID);

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
        -- 1. Delete student_due_payments (references student_dues)
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
        -- Check for any tables with student_id columns
        
        -- Delete from any promotion-related tables
        DELETE FROM student_promotions WHERE student_id = p_student_id;
        
        -- Delete from any attendance tables (if they exist)
        DELETE FROM student_attendance WHERE student_id = p_student_id;
        
        -- Delete from any grade/marks tables (if they exist)
        DELETE FROM student_grades WHERE student_id = p_student_id;
        DELETE FROM student_marks WHERE student_id = p_student_id;
        
        -- Delete from any library tables (if they exist)
        DELETE FROM library_transactions WHERE student_id = p_student_id;
        
        -- Delete from any transport tables (if they exist)
        DELETE FROM transport_assignments WHERE student_id = p_student_id;
        
        -- Delete from any medical records (if they exist)
        DELETE FROM medical_records WHERE student_id = p_student_id;
        
        -- Delete from any disciplinary records (if they exist)
        DELETE FROM disciplinary_records WHERE student_id = p_student_id;
        
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
            -- If we still get foreign key violations, provide detailed error
            RAISE EXCEPTION 'Foreign key constraint violation: %. This indicates there are additional tables referencing this student that need to be handled.', SQLERRM;
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to delete student: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative function that uses CASCADE deletion (more aggressive)
CREATE OR REPLACE FUNCTION force_delete_student_cascade(
    p_student_id UUID,
    p_deletion_reason TEXT,
    p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_student RECORD;
    v_result JSON;
BEGIN
    -- Check if student exists
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;

    -- This function temporarily disables foreign key checks
    -- WARNING: Use with extreme caution
    
    BEGIN
        -- Disable foreign key checks temporarily
        SET session_replication_role = replica;
        
        -- Delete the student (this will ignore foreign key constraints)
        DELETE FROM students WHERE id = p_student_id;
        
        -- Re-enable foreign key checks
        SET session_replication_role = DEFAULT;
        
        -- Clean up orphaned records manually
        DELETE FROM fee_payments WHERE student_id = p_student_id;
        DELETE FROM student_dues WHERE student_id = p_student_id;
        DELETE FROM pocket_money_transactions WHERE student_id = p_student_id;
        DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
        DELETE FROM student_exit_dues WHERE student_id = p_student_id;
        
        v_result := json_build_object(
            'success', true,
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'method', 'cascade_deletion',
            'message', 'Student force deleted with cascade cleanup'
        );
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Always re-enable foreign key checks
        SET session_replication_role = DEFAULT;
        RAISE EXCEPTION 'Force deletion failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_student_completely TO authenticated;
GRANT EXECUTE ON FUNCTION force_delete_student_cascade TO authenticated;

-- Show what functions were created
SELECT 
    proname as function_name,
    proargnames as arguments,
    'Function created' as status
FROM pg_proc 
WHERE proname IN ('delete_student_completely', 'force_delete_student_cascade')
ORDER BY proname;