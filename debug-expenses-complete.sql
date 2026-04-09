-- Complete Expenses Debug

-- 1. Check what the current academic year is
SELECT 
  id,
  year_label,
  is_current,
  start_date,
  end_date
FROM academic_years
WHERE is_current = true;

-- 2. Check expenses with their academic year
SELECT 
  e.id,
  e.description,
  e.amount_paise,
  e.expense_date,
  e.is_deleted,
  e.academic_year_id,
  ay.year_label,
  ay.is_current
FROM expenses e
LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
ORDER BY e.expense_date DESC;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'expenses';

-- 4. Test the exact query the API uses
SELECT *
FROM expenses
WHERE is_deleted = false
ORDER BY expense_date DESC;

-- 5. Test with academic year filter (replace with your current year ID)
SELECT *
FROM expenses
WHERE is_deleted = false
AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1)
ORDER BY expense_date DESC;

-- 6. Check if RLS is blocking
SET ROLE authenticated;
SELECT *
FROM expenses
WHERE is_deleted = false
LIMIT 5;
RESET ROLE;

-- 7. Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;
