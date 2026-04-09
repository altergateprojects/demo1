-- Fix Student Deletion Function
-- This creates a working delete_student_completely function

-- First, drop existing function if it exists
DROP FUNCTION IF EXISTS delete_student_completely(UUID, TEXT, UUID);

-- Create a simple, working version
CREATE OR REPLACE FUNCTION delete_student_completely(
    p_student_id UUID,
    p_deletion_reason TEXT,
    p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_student RECORD;
    v_result JSON;
    v_counts RECORD;
BEGIN
    -- Check if student exists
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;

    -- Log the deletion attempt
    RAISE NOTICE 'Starting deletion for student: % (ID: %)', v_student.full_name, p_student_id;

    -- Delete related records in correct order (respecting foreign keys)
    
    -- 1. Delete student due payments first (references student_dues)
    DELETE FROM student_due_payments 
    WHERE student_due_id IN (
        SELECT id FROM student_dues WHERE student_id = p_student_id
    );
    
    -- 2. Delete student dues
    DELETE FROM student_dues WHERE student_id = p_student_id;
    
    -- 3. Delete fee payments
    DELETE FROM fee_payments WHERE student_id = p_student_id;
    
    -- 4. Delete pocket money transactions
    DELETE FROM pocket_money_transactions WHERE student_id = p_student_id;
    
    -- 5. Delete year snapshots
    DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
    
    -- 6. Delete audit logs (optional, might want to keep for compliance)
    -- DELETE FROM audit_logs WHERE entity_id = p_student_id::TEXT;
    
    -- 7. Finally delete the student
    DELETE FROM students WHERE id = p_student_id;
    
    -- Create result
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
        RAISE EXCEPTION 'Cannot delete student: foreign key constraint violation. Details: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete student: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_student_completely TO authenticated;

-- Test if function was created successfully
SELECT 
    proname as function_name,
    proargnames as arguments,
    'Function created successfully' as status
FROM pg_proc 
WHERE proname = 'delete_student_completely';

-- Show any existing constraints that might cause issues
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name LIKE '%student%' OR ccu.table_name LIKE '%student%')
ORDER BY tc.table_name, tc.constraint_name;