-- Check if alumni tables exist and have data

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('alumni_records', 'left_school_records');

-- 2. Check if views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('alumni_with_details', 'left_school_with_details');

-- 3. Check alumni_records table
SELECT COUNT(*) as alumni_count FROM alumni_records;

-- 4. Check left_school_records table
SELECT COUNT(*) as left_school_count FROM left_school_records;

-- 5. Check students with graduated status
SELECT COUNT(*) as graduated_students 
FROM students 
WHERE status = 'graduated';

-- 6. Check students with left_school status
SELECT COUNT(*) as left_school_students 
FROM students 
WHERE status = 'left_school';

-- 7. Try to query the alumni view
SELECT * FROM alumni_with_details LIMIT 5;

-- 8. Try to query the left school view
SELECT * FROM left_school_with_details LIMIT 5;

-- 9. Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('mark_student_as_graduated', 'mark_student_as_left_school');

-- 10. Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('alumni_records', 'left_school_records');
