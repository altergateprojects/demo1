-- Check Expenses Issue

-- 1. Check if expenses table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'expenses'
) as table_exists;

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- 3. Count total expenses
SELECT COUNT(*) as total_expenses
FROM expenses;

-- 4. Count non-deleted expenses
SELECT COUNT(*) as active_expenses
FROM expenses
WHERE is_deleted = false;

-- 5. Check expenses by academic year
SELECT 
  ay.year_label,
  COUNT(*) as expense_count,
  SUM(e.amount_paise) as total_amount_paise
FROM expenses e
LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
WHERE e.is_deleted = false
GROUP BY ay.year_label, ay.id
ORDER BY ay.year_label DESC;

-- 6. Check current academic year
SELECT 
  id,
  year_label,
  is_current,
  start_date,
  end_date
FROM academic_years
WHERE is_current = true;

-- 7. Sample expenses data
SELECT 
  e.id,
  e.description,
  e.amount_paise,
  e.expense_date,
  e.category,
  e.is_deleted,
  ay.year_label
FROM expenses e
LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
ORDER BY e.expense_date DESC
LIMIT 10;

-- 8. Check RLS policies on expenses
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'expenses';

-- 9. Check if user has permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'expenses'
AND grantee = 'authenticated';

-- 10. Try to select expenses directly (this will show RLS issues if any)
SELECT 
  id,
  description,
  amount_paise,
  expense_date,
  is_deleted
FROM expenses
WHERE is_deleted = false
LIMIT 5;
