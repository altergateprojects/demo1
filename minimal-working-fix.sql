-- 🚀 MINIMAL WORKING FIX
-- This script only fixes what's absolutely necessary to get your app working

-- ==========================================
-- STEP 1: CREATE MISSING TABLES ONLY
-- ==========================================

-- Academic years
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_label VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'finance', 'staff', 'teacher')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    dob DATE,
    admission_date DATE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    standard_id UUID NOT NULL REFERENCES standards(id),
    guardian_name VARCHAR(255),
    phone VARCHAR(20),
    alt_phone VARCHAR(20),
    address TEXT,
    annual_fee_paise BIGINT DEFAULT 0,
    fee_paid_paise BIGINT DEFAULT 0,
    pocket_money_paise BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'withdrawn')),
    is_rte BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_profiles(id),
    deletion_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    UNIQUE(academic_year_id, roll_number)
);

-- Fee configurations (without unique constraint to avoid conflicts)
CREATE TABLE IF NOT EXISTS public.fee_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    standard_id UUID NOT NULL REFERENCES standards(id),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'all')),
    annual_fee_paise BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- ==========================================
-- STEP 2: FIX RLS POLICIES (SIMPLE)
-- ==========================================

-- Enable RLS
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow everything
DROP POLICY IF EXISTS "Allow all" ON academic_years;
DROP POLICY IF EXISTS "Allow all" ON standards;
DROP POLICY IF EXISTS "Allow all" ON user_profiles;
DROP POLICY IF EXISTS "Allow all" ON students;
DROP POLICY IF EXISTS "Allow all" ON fee_configurations;

CREATE POLICY "Allow all" ON academic_years FOR ALL USING (true);
CREATE POLICY "Allow all" ON standards FOR ALL USING (true);
CREATE POLICY "Allow all" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all" ON students FOR ALL USING (true);
CREATE POLICY "Allow all" ON fee_configurations FOR ALL USING (true);

-- ==========================================
-- STEP 3: ADD MINIMAL SAMPLE DATA
-- ==========================================

-- Academic years
INSERT INTO academic_years (year_label, start_date, end_date, is_current)
VALUES ('2024-25', '2024-04-01', '2025-03-31', true)
ON CONFLICT (year_label) DO NOTHING;

-- Only add fee configurations if we have standards
DO $$
DECLARE
    ay_id UUID;
    std_rec RECORD;
BEGIN
    -- Get academic year ID
    SELECT id INTO ay_id FROM academic_years WHERE year_label = '2024-25';
    
    -- Add fee configurations for existing standards (avoid duplicates)
    FOR std_rec IN (SELECT id, name FROM standards WHERE name IN ('1st', '2nd', '3rd', '4th', '5th') LIMIT 5)
    LOOP
        -- Delete existing config for this combination first
        DELETE FROM fee_configurations 
        WHERE academic_year_id = ay_id 
        AND standard_id = std_rec.id 
        AND gender = 'all';
        
        -- Insert new config
        INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise, notes)
        VALUES (ay_id, std_rec.id, 'all', 1000000, 'Sample fee for ' || std_rec.name);
    END LOOP;
    
    RAISE NOTICE 'Fee configurations added for available standards';
END $$;

-- Add sample students only if we have standards
DO $$
DECLARE
    ay_id UUID;
    std_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO ay_id FROM academic_years WHERE year_label = '2024-25';
    SELECT id INTO std_id FROM standards WHERE name = '1st' LIMIT 1;
    
    -- Only proceed if we have both academic year and standard
    IF ay_id IS NOT NULL AND std_id IS NOT NULL THEN
        -- Delete existing sample students first
        DELETE FROM students WHERE guardian_name LIKE 'Sample Guardian%';
        
        -- Add sample students
        INSERT INTO students (
            roll_number, full_name, gender, 
            academic_year_id, standard_id,
            annual_fee_paise, fee_paid_paise, pocket_money_paise,
            guardian_name, phone
        ) VALUES
        ('001', 'Sample Student 1', 'male', ay_id, std_id, 1000000, 0, 0, 'Sample Guardian 1', '9876543001'),
        ('002', 'Sample Student 2', 'female', ay_id, std_id, 1000000, 0, 0, 'Sample Guardian 2', '9876543002'),
        ('003', 'Sample Student 3', 'male', ay_id, std_id, 1000000, 0, 0, 'Sample Guardian 3', '9876543003');
        
        RAISE NOTICE 'Sample students added';
    ELSE
        RAISE NOTICE 'Skipping student creation - missing academic year or standards';
    END IF;
END $$;

-- ==========================================
-- STEP 4: GRANT PERMISSIONS
-- ==========================================

GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON standards TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT ALL ON fee_configurations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================
-- STEP 5: SHOW RESULTS
-- ==========================================

SELECT '=== SETUP RESULTS ===' as info;

SELECT 
    'Academic Years: ' || COUNT(*) as count
FROM academic_years;

SELECT 
    'Standards: ' || COUNT(*) as count
FROM standards;

SELECT 
    'Fee Configurations: ' || COUNT(*) as count
FROM fee_configurations;

SELECT 
    'Students: ' || COUNT(*) as count
FROM students;

-- Show fee configurations if any exist
SELECT 
    '=== FEE CONFIGURATIONS ===' as info;

SELECT 
    COALESCE(ay.year_label, 'Unknown Year') as "Year",
    COALESCE(s.name, 'Unknown Standard') as "Standard",
    fc.gender as "Gender",
    '₹' || (fc.annual_fee_paise / 100)::text as "Fee"
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY fc.created_at DESC
LIMIT 10;

SELECT '✅ Minimal setup complete! Now run add-user-profile.sql' as next_step;