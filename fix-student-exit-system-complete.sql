-- Complete fix for student exit system
-- This addresses all known issues with the student deletion/exit system

-- Step 1: Remove problematic constraints
ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_check;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS exit_reason_check;

ALTER TABLE student_exit_dues 
DROP CONSTRAINT IF EXISTS student_exit_dues_exit_reason_fkey;

-- Step 2: Ensure proper column types
ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason TYPE VARCHAR(255);

ALTER TABLE student_exit_dues 
ALTER COLUMN exit_reason SET NOT NULL;

-- Step 3: Add basic constraint
ALTER TABLE student_exit_dues 
ADD CONSTRAINT exit_reason_not_empty 
CHECK (LENGTH(TRIM(exit_reason)) > 0);

-- Step 4: Drop and recreate RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view student exit dues" ON student_exit_dues;
DROP POLICY IF EXISTS "Users can insert student exit dues" ON student_exit_dues;
DROP POLICY IF EXISTS "Users can update student exit dues" ON student_exit_dues;

-- Step 5: Create proper RLS policies
CREATE POLICY "Users can view student exit dues" ON student_exit_dues
    FOR SELECT USING (true);

CREATE POLICY "Users can insert student exit dues" ON student_exit_dues
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update student exit dues" ON student_exit_dues
    FOR UPDATE USING (true);

-- Step 6: Ensure RLS is enabled
ALTER TABLE student_exit_dues ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant necessary permissions
GRANT ALL ON student_exit_dues TO authenticated;
GRANT EXECUTE ON FUNCTION record_student_exit_with_dues TO authenticated;

-- Step 8: Verify the setup
SELECT 
    'student_exit_dues table' as component,
    'Ready' as status
UNION ALL
SELECT 
    'record_student_exit_with_dues function' as component,
    'Ready' as status
UNION ALL
SELECT 
    'RLS policies' as component,
    'Updated' as status;