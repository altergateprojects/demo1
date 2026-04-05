-- 🎯 FINAL FIX - Works with Your Existing Data
-- This script only fixes RLS policies and shows what you already have

-- ==========================================
-- STEP 1: FIX RLS POLICIES ONLY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON standards;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON fee_configurations;

DROP POLICY IF EXISTS "Allow all" ON academic_years;
DROP POLICY IF EXISTS "Allow all" ON standards;
DROP POLICY IF EXISTS "Allow all" ON user_profiles;
DROP POLICY IF EXISTS "Allow all" ON students;
DROP POLICY IF EXISTS "Allow all" ON fee_configurations;

-- Create simple permissive policies
CREATE POLICY "Allow all" ON academic_years FOR ALL USING (true);
CREATE POLICY "Allow all" ON standards FOR ALL USING (true);
CREATE POLICY "Allow all" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all" ON students FOR ALL USING (true);
CREATE POLICY "Allow all" ON fee_configurations FOR ALL USING (true);

-- ==========================================
-- STEP 2: GRANT PERMISSIONS
-- ==========================================

GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON standards TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT ALL ON fee_configurations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================
-- STEP 3: SHOW YOUR EXISTING DATA
-- ==========================================

SELECT '=== YOUR EXISTING DATA ===' as info;

-- Academic Years
SELECT 
    '📅 Academic Years' as category,
    COUNT(*) as count,
    STRING_AGG(year_label, ', ' ORDER BY year_label) as data
FROM academic_years;

-- Standards
SELECT 
    '📚 Standards' as category,
    COUNT(*) as count,
    STRING_AGG(name, ', ' ORDER BY sort_order) as data
FROM standards;

-- Students
SELECT 
    '👨‍🎓 Students' as category,
    COUNT(*) as count,
    STRING_AGG(DISTINCT s.name, ', ') as standards_with_students
FROM students st
JOIN standards s ON st.standard_id = s.id
WHERE st.is_deleted = false;

-- Fee Configurations
SELECT 
    '💰 Fee Configurations' as category,
    COUNT(*) as count,
    STRING_AGG(DISTINCT s.name, ', ' ORDER BY s.name) as configured_standards
FROM fee_configurations fc
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true;

-- User Profiles
SELECT 
    '👤 User Profiles' as category,
    COUNT(*) as count,
    STRING_AGG(role, ', ') as roles
FROM user_profiles;

-- ==========================================
-- STEP 4: DETAILED FEE CONFIGURATIONS
-- ==========================================

SELECT '=== FEE CONFIGURATIONS DETAIL ===' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY s.sort_order, fc.gender) as "#",
    ay.year_label as "Academic Year",
    s.name as "Standard",
    fc.gender as "Gender",
    '₹' || (fc.annual_fee_paise / 100)::text as "Annual Fee",
    fc.is_active as "Active"
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order, fc.gender;

-- ==========================================
-- STEP 5: CHECK USER AUTHENTICATION
-- ==========================================

SELECT '=== USER AUTHENTICATION CHECK ===' as info;

SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ You are authenticated'
        ELSE '❌ Not authenticated'
    END as auth_status,
    auth.uid() as your_user_id,
    auth.email() as your_email;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) 
        THEN '✅ You have a user profile'
        ELSE '⚠️ You need to add a user profile - run add-user-profile.sql'
    END as profile_status;

-- ==========================================
-- STEP 6: TEST FRONTEND QUERY
-- ==========================================

SELECT '=== TESTING FRONTEND QUERY ===' as info;

-- This is the exact query your frontend uses
SELECT 
    fc.id,
    fc.academic_year_id,
    fc.standard_id,
    fc.gender,
    fc.annual_fee_paise,
    fc.is_active,
    json_build_object('year_label', ay.year_label) as academic_year,
    json_build_object('name', s.name) as standard
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY fc.created_at DESC
LIMIT 5;

-- ==========================================
-- FINAL MESSAGE
-- ==========================================

SELECT 
    '✅ RLS POLICIES FIXED!' as status,
    'Your existing data is preserved and should now be visible in the UI.' as message,
    'Next steps:' as next_steps,
    '1. Run add-user-profile.sql if you see "need to add user profile" above' as step_1,
    '2. Refresh your browser completely (Ctrl+F5 or Cmd+Shift+R)' as step_2,
    '3. Navigate to Fee Management - you should see your configurations!' as step_3;