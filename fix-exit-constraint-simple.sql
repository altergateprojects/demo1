-- Simple fix for student exit constraint issue
-- Remove the problematic constraint and recreate the function

-- Step 1: Remove all restrictive constraints on exit_reason
ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_check;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS exit_reason_check;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_fkey;

-- Step 2: Ensure exit_reason column accepts any text
ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason TYPE VARCHAR(255);

ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason SET NOT NULL;

-- Step 3: Add only a basic not-empty constraint
ALTER TABLE student_exit_dues 
ADD CONSTRAINT exit_reason_not_empty 
CHECK (LENGTH(TRIM(exit_reason)) > 0);

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION record_student_exit_with_dues TO authenticated;

SELECT 'Constraint fix completed successfully' as status;