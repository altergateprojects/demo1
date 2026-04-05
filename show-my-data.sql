-- 📊 SHOW MY DATA
-- Simple script to see what you already have

SELECT '=== YOUR DATABASE SUMMARY ===' as info;

-- Academic Years
SELECT 
    '📅 Academic Years: ' || COUNT(*) as result
FROM academic_years;

SELECT year_label, start_date, end_date, is_current 
FROM academic_years 
ORDER BY start_date DESC;

-- Standards
SELECT 
    '📚 Standards: ' || COUNT(*) as result
FROM standards;

SELECT name, sort_order 
FROM standards 
ORDER BY sort_order;

-- Students
SELECT 
    '👨‍🎓 Students: ' || COUNT(*) as result
FROM students 
WHERE is_deleted = false;

SELECT 
    s.roll_number,
    s.full_name,
    st.name as standard,
    s.gender,
    '₹' || (s.annual_fee_paise / 100)::text as annual_fee
FROM students s
JOIN standards st ON s.standard_id = st.id
WHERE s.is_deleted = false
ORDER BY st.sort_order, s.roll_number
LIMIT 10;

-- Fee Configurations
SELECT 
    '💰 Fee Configurations: ' || COUNT(*) as result
FROM fee_configurations 
WHERE is_active = true;

SELECT 
    ay.year_label as "Year",
    s.name as "Standard",
    fc.gender as "Gender",
    '₹' || (fc.annual_fee_paise / 100)::text as "Fee"
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order, fc.gender;

-- User Profiles
SELECT 
    '👤 User Profiles: ' || COUNT(*) as result
FROM user_profiles;

SELECT * FROM user_profiles;

-- Check your authentication
SELECT 
    '=== YOUR AUTHENTICATION ===' as info,
    auth.uid() as your_user_id,
    auth.email() as your_email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) 
        THEN '✅ Profile exists'
        ELSE '❌ No profile - run add-user-profile.sql'
    END as profile_status;