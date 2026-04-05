-- Add cleared_date column to student_dues table if it doesn't exist

ALTER TABLE student_dues 
ADD COLUMN IF NOT EXISTS cleared_date DATE;

-- Add comment
COMMENT ON COLUMN student_dues.cleared_date IS 'Date when the due was fully cleared/paid';
