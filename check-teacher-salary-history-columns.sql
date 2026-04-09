-- Check what columns exist in teacher_salary_history table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_salary_history'
ORDER BY ordinal_position;
