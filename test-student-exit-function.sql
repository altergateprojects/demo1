-- Test the student exit function
-- This will help debug the "Failed to delete student" error

-- First, check if the function exists
SELECT 
    proname as function_name,
    proargnames as argument_names,
    prosrc as function_exists
FROM pg_proc 
WHERE proname = 'record_student_exit_with_dues'
LIMIT 1;

-- Check if student_exit_dues table exists and is accessible
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'student_exit_dues';

-- Check current constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'student_exit_dues'::regclass;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'student_exit_dues';

-- Test basic insert (this should work if constraints are fixed)
-- Note: This will fail because we don't have a real student_id, but it will show constraint errors
/*
INSERT INTO student_exit_dues (
    student_id,
    exit_date,
    exit_reason,
    pending_fee_paise,
    pending_pocket_money_paise,
    student_name,
    student_roll,
    student_standard,
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    CURRENT_DATE,
    'Test reason',
    0,
    0,
    'Test Student',
    'TEST001',
    'Test Standard',
    auth.uid()
);
*/

SELECT 'Test completed - check results above' as status;