-- ============================================================================
-- ONE-STEP FIX: Test the "Updated" Badge
-- Copy and paste this entire query into Supabase SQL Editor and run it
-- ============================================================================

-- This will:
-- 1. Check if updated_at column exists
-- 2. Add it if missing
-- 3. Update a test expense
-- 4. Show you which expenses should have the badge

-- Step 1: Add updated_at column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE expenses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    UPDATE expenses SET updated_at = created_at WHERE updated_at IS NULL;
    RAISE NOTICE '✅ Added updated_at column';
  ELSE
    RAISE NOTICE '✅ updated_at column already exists';
  END IF;
END $$;

-- Step 2: Create/update trigger for auto-updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Update the 3 most recent expenses to test the badge
UPDATE expenses
SET description = CASE 
  WHEN description LIKE '%(test edit)%' THEN description
  ELSE description || ' (test edit)'
END
WHERE id IN (
  SELECT id 
  FROM expenses 
  WHERE is_deleted = false 
  ORDER BY expense_date DESC 
  LIMIT 3
)
RETURNING 
  id,
  description,
  created_at,
  updated_at,
  '✅ This expense should show Updated badge' as status;

-- Step 4: Show summary of expenses with update status
SELECT 
  '=== SUMMARY: Which expenses should show Updated badge ===' as info,
  COUNT(*) as total_expenses,
  COUNT(CASE WHEN updated_at > created_at THEN 1 END) as should_show_badge,
  COUNT(CASE WHEN updated_at = created_at THEN 1 END) as no_badge
FROM expenses
WHERE is_deleted = false;

-- Step 5: Show the expenses that should have the badge
SELECT 
  '=== EXPENSES WITH UPDATED BADGE ===' as info,
  id,
  LEFT(description, 50) as description,
  expense_date,
  amount_paise / 100.0 as amount_rupees,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as seconds_since_creation
FROM expenses
WHERE is_deleted = false
  AND updated_at > created_at
ORDER BY expense_date DESC
LIMIT 10;

-- ============================================================================
-- DONE! Now refresh your Expenses page and you should see "✏️ Updated" badges
-- on the expenses that were just updated.
-- ============================================================================
