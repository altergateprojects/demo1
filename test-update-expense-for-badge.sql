-- ============================================================================
-- Test: Update an expense to see the "Updated" badge
-- ============================================================================

-- Step 1: Check current expenses and their timestamps
SELECT 
  id,
  description,
  amount_paise / 100.0 as amount_rupees,
  created_at,
  updated_at,
  CASE 
    WHEN updated_at IS NULL THEN '❌ No updated_at field'
    WHEN updated_at = created_at THEN '⚠️ Same as created_at'
    WHEN updated_at > created_at THEN '✅ Has been updated'
    ELSE '❓ Unknown'
  END as update_status
FROM expenses
WHERE is_deleted = false
ORDER BY expense_date DESC
LIMIT 10;

-- Step 2: Pick one expense and update it (change description slightly)
-- REPLACE 'YOUR-EXPENSE-ID-HERE' with an actual expense ID from above
/*
UPDATE expenses
SET 
  description = description || ' (edited)',
  updated_at = NOW()
WHERE id = 'YOUR-EXPENSE-ID-HERE'
RETURNING 
  id,
  description,
  created_at,
  updated_at,
  (updated_at > created_at) as is_updated;
*/

-- Step 3: Or update the most recent expense
UPDATE expenses
SET 
  description = CASE 
    WHEN description LIKE '%(edited)%' THEN description
    ELSE description || ' (edited)'
  END,
  updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM expenses 
  WHERE is_deleted = false 
  ORDER BY expense_date DESC 
  LIMIT 1
)
RETURNING 
  id,
  description,
  created_at,
  updated_at,
  (updated_at > created_at) as should_show_updated_badge;

-- Step 4: Verify the update
SELECT 
  id,
  description,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as seconds_difference,
  CASE 
    WHEN updated_at > created_at THEN '✅ Badge should show'
    ELSE '❌ Badge will not show'
  END as badge_status
FROM expenses
WHERE id = (
  SELECT id 
  FROM expenses 
  WHERE is_deleted = false 
  ORDER BY expense_date DESC 
  LIMIT 1
);

-- Step 5: Check if updated_at column exists and has trigger
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'expenses'
  AND column_name IN ('created_at', 'updated_at');

-- Step 6: Check for update trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'expenses'
  AND trigger_name LIKE '%update%';
