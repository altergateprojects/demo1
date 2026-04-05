-- 🔧 ADD MISSING STUDENT COLUMNS
-- Adds aadhaar_last_4, alternate_phone, date_of_birth and any other missing columns to students table

-- Add aadhaar_last_4 column if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_last_4 VARCHAR(4);

-- Add alternate_phone (frontend uses this name)
ALTER TABLE students ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);

-- Add date_of_birth (frontend uses this name, database has dob)
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add any other potentially missing columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS transport_required BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS hostel_required BOOLEAN DEFAULT false;

-- Copy data from existing columns to new ones
DO $$
BEGIN
    -- Copy alt_phone to alternate_phone
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'alt_phone') THEN
        UPDATE students SET alternate_phone = alt_phone WHERE alternate_phone IS NULL;
    END IF;
    
    -- Copy dob to date_of_birth
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'dob') THEN
        UPDATE students SET date_of_birth = dob WHERE date_of_birth IS NULL;
    END IF;
END $$;

-- Show the updated table structure
SELECT 
    '=== STUDENTS TABLE COLUMNS ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'students'
ORDER BY ordinal_position;

SELECT '✅ Missing columns added to students table!' as status;