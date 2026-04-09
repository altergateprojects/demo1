-- Check if salary payment tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('teacher_salary_payments', 'teacher_payment_reminders', 'teacher_advances')
ORDER BY table_name;

-- If tables exist, show their columns
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_salary_payments'
ORDER BY ordinal_position;
