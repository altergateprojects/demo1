-- 🧪 DATABASE CONNECTION TEST
-- Run this to verify your database is working correctly

-- Test 1: Check if essential tables exist
SELECT 
    '=== TABLE EXISTENCE CHECK ===' as test_name,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ All essential tables exist'
        ELSE '❌ Missing tables: ' || (5 - COUNT(*))::text
    END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('academic_years', 'standards', 'user_profiles', 'students', 'fee_configurations');

-- Test 2: Check data in tables
SELECT '=== DATA CHECK ===' as test_name;

SELECT 
    'academic_years' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM academic_years;

SELECT 
    'standards' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM standards;

SELECT 
    'fee_configurations' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM fee_configurations;

SELECT 
    'students' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM students;

-- Test 3: Check user authentication
SELECT 
    '=== USER AUTHENTICATION CHECK ===' as test_name,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ You are authenticated'
        ELSE '❌ Not authenticated'
    END as auth_status,
    auth.uid() as your_user_id,
    auth.email() as your_email;

-- Test 4: Check user profile
SELECT 
    '=== USER PROFILE CHECK ===' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) 
        THEN '✅ Profile exists'
        ELSE '❌ No profile found'
    END as profile_status;

-- Test 5: Test the exact query used by frontend
SELECT '=== FRONTEND QUERY TEST ===' as test_name;

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
LIMIT 3;

-- Test 6: Check RLS policies
SELECT 
    '=== RLS POLICY CHECK ===' as test_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ RLS policies exist'
        ELSE '❌ Missing RLS policies'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('academic_years', 'standards', 'user_profiles', 'students', 'fee_configurations');

-- Final summary
SELECT 
    '=== SUMMARY ===' as section,
    'If all tests show ✅, your database is ready!' as message,
    'If any show ❌, run comprehensive-database-fix.sql' as fix_action;