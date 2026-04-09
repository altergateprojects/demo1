-- Check existing salary-related tables and their columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('teacher_salary_history', 'teacher_bonuses', 'teachers')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
