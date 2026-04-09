-- Complete RLS Fix for Expenses

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON expenses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON expenses;

-- 2. Disable RLS temporarily to test
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions
GRANT ALL ON expenses TO authenticated;
GRANT ALL ON expenses TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Test query
SELECT 
  COUNT(*) as total_expenses,
  COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_expenses
FROM expenses;

-- 5. Show sample data
SELECT 
  id,
  description,
  amount_paise,
  expense_date,
  is_deleted,
  academic_year_id
FROM expenses
WHERE is_deleted = false
LIMIT 5;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ RLS DISABLED for testing';
  RAISE NOTICE '✓ Full permissions granted';
  RAISE NOTICE '✓ Try refreshing the expenses page now';
  RAISE NOTICE '';
  RAISE NOTICE 'If expenses show up now, the issue is RLS policies';
  RAISE NOTICE 'If they still dont show, the issue is in the frontend code';
END $$;
