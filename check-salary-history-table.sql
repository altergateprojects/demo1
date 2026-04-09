-- Check if teacher_salary_history table exists and its structure
SELECT 
  '=== TEACHER SALARY HISTORY TABLE ===' as info;

-- Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'teacher_salary_history'
    ) THEN '✓ Table EXISTS'
    ELSE '✗ Table DOES NOT EXIST'
  END as table_status;

-- Show columns if table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_salary_history'
ORDER BY ordinal_position;

-- Show sample data
SELECT 
  '=== SAMPLE DATA ===' as info;

SELECT *
FROM teacher_salary_history
ORDER BY effective_date DESC
LIMIT 5;

-- Count records
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT teacher_id) as unique_teachers
FROM teacher_salary_history;
