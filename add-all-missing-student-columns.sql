-- 🔧 ADD ALL MISSING STUDENT COLUMNS AT ONCE
-- Comprehensive script to add all columns the frontend expects

-- Add all missing columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_last_4 VARCHAR(4);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS transport_required BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS hostel_required BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes TEXT;

-- Copy data from old column names to new ones
DO $$
BEGIN
    -- Copy phone to phone_number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'phone') THEN
        UPDATE students SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL;
    END IF;
    
    -- Copy alt_phone to alternate_phone
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'alt_phone') THEN
        UPDATE students SET alternate_phone = alt_phone WHERE alternate_phone IS NULL AND alt_phone IS NOT NULL;
    END IF;
    
    -- Copy dob to date_of_birth
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'dob') THEN
        UPDATE students SET date_of_birth = dob WHERE date_of_birth IS NULL AND dob IS NOT NULL;
    END IF;
    
    -- Copy aadhaar_last4 to aadhaar_last_4 (if different naming exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'aadhaar_last4') THEN
        UPDATE students SET aadhaar_last_4 = aadhaar_last4 WHERE aadhaar_last_4 IS NULL AND aadhaar_last4 IS NOT NULL;
    END IF;
END $$;

-- Show all student table columns
SELECT 
    '=== ALL STUDENTS TABLE COLUMNS ===' as info;

SELECT 
    column_name as "Column Name",
    data_type as "Data Type",
    is_nullable as "Nullable",
    COALESCE(column_default, 'NULL') as "Default"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'students'
ORDER BY ordinal_position;

-- Show column count
SELECT 
    '✅ COMPLETE!' as status,
    'Total columns: ' || COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'students';

SELECT 
    'All missing columns have been added!' as message,
    'Refresh your browser and try adding/editing students again.' as next_step;