-- Essential Tables Setup for Basic Functionality
-- Run this first if you're having database connection issues

-- 1. Create academic_years table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_label VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create standards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_profiles table if it doesn't exist
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

-- 4. Create students table if it doesn't exist
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

-- 5. Create fee_configurations table if it doesn't exist
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
    created_by UUID REFERENCES user_profiles(id),
    UNIQUE(academic_year_id, standard_id, gender)
);

-- Enable RLS on all tables
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for authenticated users)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON academic_years;
CREATE POLICY "Allow all for authenticated users" ON academic_years FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON standards;
CREATE POLICY "Allow all for authenticated users" ON standards FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;
CREATE POLICY "Allow all for authenticated users" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON students;
CREATE POLICY "Allow all for authenticated users" ON students FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON fee_configurations;
CREATE POLICY "Allow all for authenticated users" ON fee_configurations FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data if tables are empty

-- Sample academic year
INSERT INTO academic_years (year_label, start_date, end_date, is_current)
SELECT '2024-25', '2024-04-01', '2025-03-31', true
WHERE NOT EXISTS (SELECT 1 FROM academic_years);

-- Sample standards
INSERT INTO standards (name, sort_order) VALUES
('Nursery', 1),
('LKG', 2),
('UKG', 3),
('1st', 4),
('2nd', 5),
('3rd', 6),
('4th', 7),
('5th', 8),
('6th', 9),
('7th', 10),
('8th', 11),
('9th', 12),
('10th', 13)
ON CONFLICT (name) DO NOTHING;

-- Sample user profile (you'll need to replace the UUID with your actual auth user ID)
-- Get your user ID by running: SELECT auth.uid();
-- Then replace 'YOUR_USER_ID_HERE' with the actual UUID

-- INSERT INTO user_profiles (id, full_name, email, role)
-- VALUES ('YOUR_USER_ID_HERE', 'Admin User', 'admin@school.com', 'admin')
-- ON CONFLICT (id) DO NOTHING;

-- Sample fee configuration
INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise, created_by)
SELECT 
    ay.id,
    s.id,
    'all',
    1000000, -- ₹10,000 in paise
    NULL -- Will be set when you have a user profile
FROM academic_years ay
CROSS JOIN standards s
WHERE ay.year_label = '2024-25'
AND s.name IN ('1st', '2nd', '3rd')
AND NOT EXISTS (
    SELECT 1 FROM fee_configurations fc 
    WHERE fc.academic_year_id = ay.id 
    AND fc.standard_id = s.id 
    AND fc.gender = 'all'
);

-- Grant permissions
GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON standards TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT ALL ON fee_configurations TO authenticated;

-- Success message
SELECT 'Essential tables created successfully! You can now use the application.' as status,
       'Next: Add your user profile and create some students to test the system.' as next_step;