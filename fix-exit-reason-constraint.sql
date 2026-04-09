-- Fix Exit Reason Constraint Issue
-- This removes the restrictive constraint and allows any exit reason

-- First, let's see what constraints exist
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'student_exit_dues'::regclass
AND contype = 'c'; -- check constraints

-- Drop the restrictive exit_reason check constraint
ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_check;

-- Also drop any other potential exit reason constraints
ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS exit_reason_check;

-- Also drop any enum-based constraints that might exist
ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_fkey;

-- Make sure the column can accept any text value
ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason TYPE VARCHAR(255);

-- Add a simple not-null constraint instead (more flexible)
ALTER TABLE student_exit_dues 
ADD CONSTRAINT exit_reason_not_null 
CHECK (exit_reason IS NOT NULL AND LENGTH(TRIM(exit_reason)) > 0);

-- Test that we can now insert any exit reason
INSERT INTO student_exit_dues (
    student_id,
    exit_reason,
    pending_fee_paise,
    student_name,
    student_roll,
    created_by
) VALUES (
    gen_random_uuid(), -- dummy student ID for test
    'Transfer to another school', -- this should work now
    0,
    'Test Student',
    'TEST001',
    auth.uid()
) ON CONFLICT DO NOTHING;

-- Clean up the test record
DELETE FROM student_exit_dues WHERE student_name = 'Test Student';

-- Show current constraints after fix
SELECT 
    'Constraints after fix:' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'student_exit_dues'::regclass
AND contype = 'c';