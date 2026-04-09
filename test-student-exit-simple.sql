-- Simple Test for Student Exit Function
-- Run this after the fix to verify everything works

-- 1. Check if function exists
SELECT 
    'Function Status' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'record_student_exit_with_dues'
AND routine_schema = 'public';

-- 2. Check if table exists with required columns
SELECT 
    'Table Status' as check_type,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ Table exists with all columns'
        ELSE '⚠️ Table missing columns: ' || (10 - COUNT(*))::text
    END as status
FROM information_schema.columns 
WHERE table_name = 'student_exit_dues'
AND table_schema = 'public'
AND column_name IN (
    'id', 'student_id', 'exit_reason', 'pending_fee_paise', 
    'student_name', 'student_roll', 'created_by', 'exit_date',
    'pending_pocket_money_paise', 'notes'
);

-- 3. Check RLS policies
SELECT 
    'Security Status' as check_type,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ RLS policies exist'
        ELSE '⚠️ Missing RLS policies'
    END as status
FROM pg_policies 
WHERE tablename = 'student_exit_dues';

-- 4. Find a test student (active with some dues)
SELECT 
    'Test Student Available' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Found ' || COUNT(*) || ' students with dues for testing'
        ELSE '⚠️ No students with dues found for testing'
    END as status
FROM students 
WHERE status = 'active' 
AND (
    (annual_fee_paise - fee_paid_paise) > 0 
    OR pocket_money_paise < 0
);

-- 5. Show sample students for testing (if any)
SELECT 
    id,
    full_name,
    roll_number,
    (annual_fee_paise - fee_paid_paise) as pending_fee_paise,
    pocket_money_paise,
    status
FROM students 
WHERE status = 'active' 
AND (
    (annual_fee_paise - fee_paid_paise) > 0 
    OR pocket_money_paise < 0
)
LIMIT 3;

-- Instructions for manual testing:
-- 
-- If all checks show ✅, you can test with a real student:
-- 
-- SELECT record_student_exit_with_dues(
--     'STUDENT_ID_FROM_ABOVE'::UUID,
--     'Test exit - Financial difficulties',
--     CURRENT_DATE,
--     'Testing the student exit system'
-- );
--
-- Then check the results:
-- SELECT * FROM student_exit_dues WHERE student_id = 'STUDENT_ID_FROM_ABOVE';
-- SELECT status FROM students WHERE id = 'STUDENT_ID_FROM_ABOVE';