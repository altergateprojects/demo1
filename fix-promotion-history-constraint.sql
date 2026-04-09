-- Fix for student_promotion_history foreign key constraint
-- This addresses the specific error: "student_promotion_history_snapshot_id_fkey"

-- First, let's check what's in the student_promotion_history table
SELECT 
    'student_promotion_history records' as info,
    COUNT(*) as count
FROM student_promotion_history;

-- Check the foreign key constraint
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'student_promotion_history';

-- Update the existing delete function to handle student_promotion_history
CREATE OR REPLACE FUNCTION delete_student_completely(
    p_student_id UUID,
    p_deletion_reason TEXT,
    p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_student RECORD;
    v_result JSON;
    v_error_details TEXT;
BEGIN
    -- Check if student exists
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;

    -- Log the deletion attempt
    RAISE NOTICE 'Starting comprehensive deletion for student: % (ID: %)', v_student.full_name, p_student_id;

    BEGIN
        -- Delete in proper order to handle ALL foreign key constraints
        
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
        
        -- 6. Delete student_promotion_history FIRST (references student_year_snapshots)
        DELETE FROM student_promotion_history 
        WHERE snapshot_id IN (
            SELECT id FROM student_year_snapshots WHERE student_id = p_student_id
        );
        
        -- 7. Delete student_year_snapshots (references students)
        DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
        
        -- 8. Delete any other possible references that might exist
        -- Use dynamic SQL to check if tables exist before deleting
        
        -- Check and delete from student_promotions if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_promotions') THEN
            EXECUTE 'DELETE FROM student_promotions WHERE student_id = $1' USING p_student_id;
        END IF;
        
        -- Check and delete from student_attendance if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_attendance') THEN
            EXECUTE 'DELETE FROM student_attendance WHERE student_id = $1' USING p_student_id;
        END IF;
        
        -- Check and delete from student_grades if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_grades') THEN
            EXECUTE 'DELETE FROM student_grades WHERE student_id = $1' USING p_student_id;
        END IF;
        
        -- 9. Finally delete the student record
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
        
        -- Log successful deletion in audit_logs if table exists
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
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
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Continue even if audit logging fails
            RAISE NOTICE 'Audit logging failed: %', SQLERRM;
        END;
        
        RETURN v_result;
        
    EXCEPTION 
        WHEN foreign_key_violation THEN
            GET STACKED DIAGNOSTICS v_error_details = MESSAGE_TEXT;
            RAISE EXCEPTION 'Foreign key constraint violation: %. This indicates there are additional tables referencing this student that need to be handled.', SQLERRM;
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS v_error_details = MESSAGE_TEXT;
            RAISE EXCEPTION 'Failed to delete student: %. Error details: %', SQLERRM, v_error_details;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the force delete function as well
CREATE OR REPLACE FUNCTION force_delete_student_cascade(
    p_student_id UUID,
    p_deletion_reason TEXT,
    p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_student RECORD;
    v_result JSON;
    v_tables_cleaned TEXT[] := ARRAY[]::TEXT[];
    v_records_deleted INTEGER := 0;
    v_temp_count INTEGER;
BEGIN
    -- Check if student exists
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;

    -- Force delete all related records
    RAISE NOTICE 'Force deleting all records for student: % (ID: %)', v_student.full_name, p_student_id;
    
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
    
    -- Delete from student_promotion_history FIRST (references student_year_snapshots)
    DELETE FROM student_promotion_history 
    WHERE snapshot_id IN (SELECT id FROM student_year_snapshots WHERE student_id = p_student_id);
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'student_promotion_history: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Delete from student_year_snapshots
    DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'student_year_snapshots: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Delete the student record
    DELETE FROM students WHERE id = p_student_id;
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    IF v_temp_count > 0 THEN
        v_tables_cleaned := array_append(v_tables_cleaned, 'students: ' || v_temp_count);
        v_records_deleted := v_records_deleted + v_temp_count;
    END IF;
    
    -- Create success result
    v_result := json_build_object(
        'success', true,
        'student_id', p_student_id,
        'student_name', v_student.full_name,
        'student_roll', v_student.roll_number,
        'deletion_reason', p_deletion_reason || ' (Force deleted)',
        'deleted_at', NOW(),
        'deleted_by', COALESCE(p_deleted_by, auth.uid()),
        'total_records_deleted', v_records_deleted,
        'tables_cleaned', v_tables_cleaned,
        'message', 'Student force deleted successfully with all related data'
    );
    
    -- Log successful force deletion
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
            INSERT INTO audit_logs (
                action_type,
                entity_type,
                entity_id,
                entity_label,
                description,
                created_by
            ) VALUES (
                'FORCE_DELETE',
                'student',
                p_student_id::TEXT,
                v_student.full_name || ' (' || v_student.roll_number || ')',
                'Force deletion: ' || p_deletion_reason || '. Records deleted: ' || v_records_deleted,
                COALESCE(p_deleted_by, auth.uid())
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Audit logging failed: %', SQLERRM;
    END;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Force deletion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_student_completely TO authenticated;
GRANT EXECUTE ON FUNCTION force_delete_student_cascade TO authenticated;

-- Show confirmation
SELECT 'Functions updated to handle student_promotion_history constraint' as status;