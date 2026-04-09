-- Diagnose Foreign Key Constraints for Student Deletion
-- This will find ALL tables that reference the students table

-- Find all foreign key constraints that reference the students table
SELECT 
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'students'
ORDER BY tc.table_name;

-- Check for any records in these tables for a specific student
-- Replace 'STUDENT_ID_HERE' with actual student ID to test
/*
-- Example queries to check for related records:
SELECT 'fee_payments' as table_name, COUNT(*) as count FROM fee_payments WHERE student_id = 'STUDENT_ID_HERE'
UNION ALL
SELECT 'student_dues' as table_name, COUNT(*) as count FROM student_dues WHERE student_id = 'STUDENT_ID_HERE'
UNION ALL
SELECT 'pocket_money_transactions' as table_name, COUNT(*) as count FROM pocket_money_transactions WHERE student_id = 'STUDENT_ID_HERE'
UNION ALL
SELECT 'student_year_snapshots' as table_name, COUNT(*) as count FROM student_year_snapshots WHERE student_id = 'STUDENT_ID_HERE'
UNION ALL
SELECT 'student_due_payments' as table_name, COUNT(*) as count FROM student_due_payments 
WHERE student_due_id IN (SELECT id FROM student_dues WHERE student_id = 'STUDENT_ID_HERE')
UNION ALL
SELECT 'student_exit_dues' as table_name, COUNT(*) as count FROM student_exit_dues WHERE student_id = 'STUDENT_ID_HERE';
*/

-- Show all tables that might have student references
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name LIKE '%student%' 
    AND table_name NOT LIKE 'pg_%' 
    AND table_name NOT LIKE 'information_%'
ORDER BY table_name, column_name;

SELECT 'Diagnosis complete - check results above' as status;