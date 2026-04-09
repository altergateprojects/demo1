-- Fix Expenses Display Issues

-- 1. Ensure RLS is enabled
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON expenses;

-- 3. Create simple RLS policies that allow authenticated users to view all expenses
CREATE POLICY "Users can view expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Check if academic_year_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'academic_year_id'
  ) THEN
    -- Add academic_year_id if it doesn't exist
    ALTER TABLE expenses 
    ADD COLUMN academic_year_id UUID REFERENCES academic_years(id);
    
    -- Set academic_year_id for existing expenses based on expense_date
    UPDATE expenses e
    SET academic_year_id = (
      SELECT ay.id
      FROM academic_years ay
      WHERE e.expense_date >= ay.start_date 
      AND e.expense_date <= ay.end_date
      LIMIT 1
    )
    WHERE academic_year_id IS NULL;
    
    RAISE NOTICE '✓ Added academic_year_id column to expenses';
  END IF;
END $$;

-- 6. Ensure is_deleted column exists and has default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE expenses 
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE '✓ Added is_deleted column to expenses';
  END IF;
END $$;

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_academic_year 
  ON expenses(academic_year_id, expense_date DESC) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_expenses_not_deleted 
  ON expenses(is_deleted, expense_date DESC);

-- 8. Show current state
SELECT 
  'Total Expenses' as metric,
  COUNT(*) as count
FROM expenses
UNION ALL
SELECT 
  'Active Expenses' as metric,
  COUNT(*) as count
FROM expenses
WHERE is_deleted = false
UNION ALL
SELECT 
  'Expenses with Academic Year' as metric,
  COUNT(*) as count
FROM expenses
WHERE academic_year_id IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Expenses table fixed';
  RAISE NOTICE '✓ RLS policies updated';
  RAISE NOTICE '✓ Permissions granted';
  RAISE NOTICE '✓ Indexes created';
END $$;
