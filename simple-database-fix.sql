-- 🔧 SIMPLE DATABASE FIX
-- This script safely fixes all issues without constraint conflicts

-- ==========================================
-- STEP 1: FIX DUPLICATE SORT ORDER ISSUE
-- ==========================================

-- First, let's see what we have
SELECT 'Current standards with sort_order conflicts:' as info;
SELECT name, sort_order, COUNT(*) as count
FROM standards 
GROUP BY name, sort_order 
HAVING COUNT(*) > 1 OR sort_order IN (
    SELECT sort_order FROM standards GROUP BY sort_order HAVING COUNT(*) > 1
);

-- Fix duplicate sort_order values
UPDATE standards SET sort_order = (
    SELECT ROW_NUMBER() OVER (ORDER BY name)
    FROM (SELECT DISTINCT name FROM standards) s
    WHERE s.name = standards.name
);

-- ==========================================
-- STEP 2: CREATE MISSING TABLES SAFELY
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

-- Standards (already exists, just ensure it's proper)
CREATE TABLE IF NOT EXISTS public.standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL,
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

-- Fee configurations
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
-- STEP 3: FIX RLS POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON standards;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON fee_configurations;

CREATE POLICY "Allow all for authenticated users" ON academic_years FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON standards FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON students FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON fee_configurations FOR ALL USING (true);

-- ==========================================
-- STEP 4: ADD SAMPLE DATA
-- ==========================================

-- Academic years
INSERT INTO academic_years (year_label, start_date, end_date, is_current)
VALUES ('2024-25', '2024-04-01', '2025-03-31', true)
ON CONFLICT (year_label) DO NOTHING;

INSERT INTO academic_years (year_label, start_date, end_date, is_current)
VALUES ('2025-26', '2025-04-01', '2026-03-31', false)
ON CONFLICT (year_label) DO NOTHING;

-- Ensure we have proper standards
INSERT INTO standards (name, sort_order) VALUES
('Nursery', 1), ('LKG', 2), ('UKG', 3), ('1st', 4), ('2nd', 5),
('3rd', 6), ('4th', 7), ('5th', 8), ('6th', 9), ('7th', 10),
('8th', 11), ('9th', 12), ('10th', 13)
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- Add sample fee configurations (delete existing ones first to avoid conflicts)
DELETE FROM fee_configurations WHERE notes = 'Sample configuration';

INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise, notes)
SELECT 
    ay.id,
    s.id,
    'all',
    1000000,
    'Sample configuration'
FROM academic_years ay
CROSS JOIN standards s
WHERE ay.year_label = '2024-25'
AND s.name IN ('1st', '2nd', '3rd', '4th', '5th');

-- Add sample students (delete existing ones first)
DELETE FROM students WHERE guardian_name LIKE 'Guardian %';

INSERT INTO students (
    roll_number, full_name, gender, 
    academic_year_id, standard_id,
    annual_fee_paise, fee_paid_paise, pocket_money_paise,
    guardian_name, phone
)
SELECT 
    LPAD(generate_series(1,5)::text, 3, '0'),
    'Student ' || generate_series(1,5),
    CASE WHEN generate_series(1,5) % 2 = 0 THEN 'female' ELSE 'male' END,
    ay.id,
    s.id,
    1000000, 0, 0,
    'Guardian ' || generate_series(1,5),
    '9876543' || LPAD(generate_series(1,5)::text, 3, '0')
FROM academic_years ay, standards s
WHERE ay.year_label = '2024-25' AND s.name = '1st';

-- ==========================================
-- STEP 5: GRANT PERMISSIONS
-- ==========================================

GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON standards TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT ALL ON fee_configurations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================
-- STEP 6: VERIFICATION
-- ==========================================

SELECT '=== SETUP COMPLETE ===' as status;

SELECT 
    'Academic Years: ' || COUNT(*) as result
FROM academic_years;

SELECT 
    'Standards: ' || COUNT(*) as result
FROM standards;

SELECT 
    'Fee Configurations: ' || COUNT(*) as result
FROM fee_configurations;

SELECT 
    'Students: ' || COUNT(*) as result
FROM students;

-- Show fee configurations
SELECT 
    ay.year_label as "Year",
    s.name as "Standard",
    fc.gender as "Gender",
    '₹' || (fc.annual_fee_paise / 100)::text as "Fee"
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order;

SELECT '✅ Database setup complete! Refresh your browser.' as final_message;