-- Make student_id nullable in student_dues table
-- This allows recording dues for students who have passed out or left school

-- Remove NOT NULL constraint from student_id
ALTER TABLE student_dues 
ALTER COLUMN student_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'student_dues'
AND column_name = 'student_id';

-- Show message
SELECT 'student_id column is now nullable - can record dues for past students!' as status;
