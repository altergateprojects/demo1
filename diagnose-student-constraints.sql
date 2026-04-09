-- Diagnose Foreign Key Constraints for Student Deletion
-- Run this to see exactly what's preventing student deletion

-- Replace 'STUDENT_ID_HERE' with the actual student ID that's failing to delete
-- Example: '5c088761-7a14-46d7-b016-1c5cfb8112c3'

-- Check what records exist for this student
WITH student_id AS (
    SELECT '5c088761-7a14-46d7-b016-1c5cfb8112c3'::UUID as id  -- Replace with actual student ID
)
SELECT 
    'student_due_payments' as table_name,
    COUNT(*) as record_count
FROM student_due_payments sdp 
JOIN student_dues sd ON sdp.student_due_id = sd.id 
JOIN student_id si ON sd.student_id = si.id

UNION ALL

SELECT 
    'student_dues' as table_name,
    COUNT(*) as record_count
FROM student_dues sd
JOIN student_id si ON sd.student_id = si.id

UNION ALL

SELECT 
    'student_exit_dues' as table_name,
    COUNT(*) as record_count
FROM student_exit_dues sed
JOIN student_id si ON sed.student_id = si.id

UNION ALL

SELECT 
    'fee_payments' as table_name,
    COUNT(*) as record_count
FROM fee_payments fp
JOIN student_id si ON fp.student_id = si.id

UNION ALL

SELECT 
    'pocket_money_transactions' as table_name,
    COUNT(*) as record_count
FROM pocket_money_transactions pmt
JOIN student_id si ON pmt.student_id = si.id

UNION ALL

SELECT 
    'student_promotion_history' as table_name,
    COUNT(*) as record_count
FROM student_promotion_history sph
JOIN student_year_snapshots sys ON sph.snapshot_id = sys.id
JOIN student_id si ON sys.student_id = si.id

UNION ALL

SELECT 
    'student_year_snapshots' as table_name,
    COUNT(*) as record_count
FROM student_year_snapshots sys
JOIN student_id si ON sys.student_id = si.id

ORDER BY record_count DESC;

-- Check the specific foreign key constraint that's causing issues
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'student_promotion_history' 
         OR ccu.table_name = 'student_year_snapshots')
ORDER BY tc.table_name;

-- Check if the functions exist
SELECT 
    proname as function_name,
    'EXISTS' as status
FROM pg_proc 
WHERE proname IN ('delete_student_completely', 'force_delete_student_cascade', 'check_student_references')
ORDER BY proname;