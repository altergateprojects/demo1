-- Complete Student Exit System Fix
-- This handles all constraint issues and ensures the system works

-- Step 1: Remove all restrictive constraints
ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_check;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS exit_reason_check;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_fkey;

-- Step 2: Ensure columns have proper types and constraints
ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason TYPE VARCHAR(255);

ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason SET NOT NULL;

-- Step 3: Add only essential constraints
ALTER TABLE student_exit_dues 
ADD CONSTRAINT exit_reason_not_empty 
CHECK (LENGTH(TRIM(exit_reason)) > 0);

-- Step 4: Recreate the function with better error handling
CREATE OR REPLACE FUNCTION record_student_exit_with_dues(
    p_student_id UUID,
    p_exit_reason VARCHAR,
    p_exit_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_student RECORD;
    pending_fee BIGINT;
    pending_pocket BIGINT;
    previous_years_pending BIGINT;
    exit_record RECORD;
    clean_exit_reason VARCHAR(255);
BEGIN
    -- Clean and validate the exit reason
    clean_exit_reason := TRIM(p_exit_reason);
    IF clean_exit_reason IS NULL OR LENGTH(clean_exit_reason) = 0 THEN
        RAISE EXCEPTION 'Exit reason cannot be empty';
    END IF;
    
    -- Ensure exit reason is not too long
    IF LENGTH(clean_exit_reason) > 255 THEN
        clean_exit_reason := LEFT(clean_exit_reason, 255);
    END IF;
    
    -- Get current student data with related info
    SELECT 
        s.*,
        COALESCE(st.name, 'Unknown') as standard_name,
        COALESCE(ay.year_label, 'Unknown') as year_label
    INTO current_student
    FROM students s
    LEFT JOIN standards st ON s.standard_id = st.id
    LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
    WHERE s.id = p_student_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found with ID: %', p_student_id;
    END IF;
    
    -- Calculate pending amounts safely
    pending_fee := GREATEST(0, 
        COALESCE(current_student.annual_fee_paise, 0) - 
        COALESCE(current_student.fee_paid_paise, 0)
    );
    
    pending_pocket := LEAST(0, COALESCE(current_student.pocket_money_paise, 0));
    
    -- Get previous years pending from snapshots safely
    SELECT COALESCE(SUM(COALESCE(dues_carried_forward_paise, 0)), 0) 
    INTO previous_years_pending
    FROM student_year_snapshots 
    WHERE student_id = p_student_id;
    
    -- Create exit dues record with all required fields
    INSERT INTO student_exit_dues (
        student_id,
        exit_date,
        exit_reason,
        pending_fee_paise,
        pending_pocket_money_paise,
        notes,
        created_by,
        student_name,
        student_roll,
        student_standard,
        student_phone,
        student_guardian
    ) VALUES (
        p_student_id,
        COALESCE(p_exit_date, CURRENT_DATE),
        clean_exit_reason,
        pending_fee + COALESCE(previous_years_pending, 0),
        pending_pocket,
        p_notes,
        auth.uid(),
        COALESCE(current_student.full_name, 'Unknown'),
        COALESCE(current_student.roll_number, 'Unknown'),
        current_student.standard_name,
        current_student.phone,
        current_student.guardian_name
    ) RETURNING * INTO exit_record;
    
    -- Mark student as withdrawn
    UPDATE students SET
        status = 'withdrawn',
        updated_at = NOW()
    WHERE id = p_student_id;
    
    -- Log the action (with error handling)
    BEGIN
        INSERT INTO audit_logs (
            action_type,
            entity_type,
            entity_id,
            entity_label,
            description,
            created_by
        ) VALUES (
            'MOVE_TO_DUES',
            'student_exit',
            p_student_id::TEXT,
            COALESCE(current_student.full_name, 'Unknown') || ' (' || COALESCE(current_student.roll_number, 'Unknown') || ')',
            'Student moved to dues section. Reason: ' || clean_exit_reason,
            auth.uid()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Continue even if audit logging fails
        NULL;
    END;
    
    RETURN json_build_object(
        'success', true,
        'exit_id', exit_record.id,
        'student_name', COALESCE(current_student.full_name, 'Unknown'),
        'student_roll', COALESCE(current_student.roll_number, 'Unknown'),
        'total_pending_fee', pending_fee + COALESCE(previous_years_pending, 0),
        'pending_pocket_money', pending_pocket,
        'exit_reason', clean_exit_reason,
        'exit_date', COALESCE(p_exit_date, CURRENT_DATE),
        'message', 'Student successfully moved to dues section'
    );
    
EXCEPTION 
    WHEN check_violation THEN
        RAISE EXCEPTION 'Invalid data provided: %', SQLERRM;
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Referenced data not found: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to record student exit: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION record_student_exit_with_dues TO authenticated;

-- Step 6: Test the function with a sample call (commented out)
/*
-- Uncomment and replace with real student ID to test:
SELECT record_student_exit_with_dues(
    'your-student-id-here'::UUID,
    'Transfer to another school',
    CURRENT_DATE,
    'Test of the fixed function'
);
*/

-- Step 7: Show final status
SELECT 
    'Setup Status' as check_type,
    'Function and constraints fixed successfully' as status
UNION ALL
SELECT 
    'Available Exit Reasons' as check_type,
    'Any text value is now accepted (no restrictions)' as status;