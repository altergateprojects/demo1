-- Check Current Database State
-- Run this to see what you currently have

-- 1. Check if main tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('academic_years'),
        ('standards'),
        ('students'),
        ('user_profiles'),
        ('fee_configurations'),
        ('fee_payments')
) AS t(table_name);

-- 2. Check data counts
SELECT 'academic_years' as table_name, COUNT(*) as record_count FROM academic_years
UNION ALL
SELECT 'standards', COUNT(*) FROM standards
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'fee_configurations', COUNT(*) FROM fee_configurations WHERE EXISTS (SELECT 1 FROM fee_configurations LIMIT 1)
ORDER BY table_name;

-- 3. Check current academic year
SELECT 
    'Current Academic Year:' as info,
    year_label,
    is_current,
    start_date,
    end_date
FROM academic_years 
WHERE is_current = true;

-- 4. Check standards (first 10)
SELECT 
    'Standards:' as info,
    name,
    sort_order
FROM standards 
ORDER BY sort_order 
LIMIT 10;

-- 5. Check if you have a user profile
SELECT 
    'Your User Profile:' as info,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ NOT LOGGED IN'
        WHEN EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) THEN '✅ PROFILE EXISTS'
        ELSE '❌ NO PROFILE'
    END as status,
    auth.uid() as your_user_id;

-- 6. Check fee configurations (if any)
SELECT 
    'Fee Configurations:' as info,
    COUNT(*) as total_configs,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_configs
FROM fee_configurations
WHERE EXISTS (SELECT 1 FROM fee_configurations LIMIT 1);

-- 7. Show sample fee configurations if they exist
SELECT 
    fc.id,
    ay.year_label,
    s.name as standard_name,
    fc.gender,
    fc.annual_fee_paise / 100 as annual_fee_rupees,
    fc.is_active
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order
LIMIT 5;