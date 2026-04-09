-- Check the actual columns in teacher_salary_payments table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_salary_payments'
ORDER BY ordinal_position;
