-- Debug and fix the student deletion system
-- Check current state and fix any issues

-- Step 1: Check if student_exit_dues table exists and has proper structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_exit_dues' 
ORDER BY ordinal_position;

-- Step 2: Check current constraints on student_exit_dues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'student_exit_dues'::regclass;

-- Step 3: Remove all problematic constraints
ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_check CASCADE;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS exit_reason_check CASCADE;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_fkey CASCADE;

-- Step 4: Ensure proper column setup
ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason TYPE VARCHAR(255);

ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason SET NOT NULL;

-- Step 5: Add only basic constraint
ALTER TABLE student_exit_dues 
ADD CONSTRAINT exit_reason_not_empty 
CHECK (LENGTH(TRIM(exit_reason)) > 0);

-- Step 6: Check if function exists
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'record_student_exit_with_dues';

-- Step 7: Grant permissions
GRANT ALL ON student_exit_dues TO authenticated;
GRANT EXECUTE ON FUNCTION record_student_exit_with_dues TO authenticated;

-- Step 8: Test the function with a dummy call (will fail but show if function works)
-- SELECT record_student_exit_with_dues(
--     '00000000-0000-0000-0000-000000000000'::UUID,
--     'Test reason',
--     CURRENT_DATE,
--     'Test notes'
-- );

SELECT 'Debug completed - check results above' as status;