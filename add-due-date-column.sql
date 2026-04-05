-- Add missing due_date column to student_dues table

-- Check if column exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'student_dues' 
        AND column_name = 'due_date'
    ) THEN
        -- Add the column
        ALTER TABLE student_dues 
        ADD COLUMN due_date DATE NOT NULL DEFAULT CURRENT_DATE;
        
        RAISE NOTICE 'due_date column added successfully';
    ELSE
        RAISE NOTICE 'due_date column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'student_dues'
AND column_name = 'due_date';

-- Show all columns in student_dues table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'student_dues'
ORDER BY ordinal_position;
