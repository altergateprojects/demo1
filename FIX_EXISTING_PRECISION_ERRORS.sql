-- ============================================================================
-- FIX EXISTING PRECISION ERRORS IN DATABASE
-- This fixes expenses that were created with the buggy code
-- ============================================================================

-- Step 1: Identify expenses with precision errors
SELECT 
  '=== EXPENSES WITH PRECISION ERRORS ===' as step,
  id,
  description,
  amount_paise,
  amount_paise / 100.0 as current_rupees,
  MOD(amount_paise, 100) as paise_part,
  CASE 
    -- Likely meant to be next whole rupee
    WHEN MOD(amount_paise, 100) BETWEEN 94 AND 99 THEN 
      CEIL(amount_paise / 100.0) * 100
    -- Likely meant to be previous whole rupee  
    WHEN MOD(amount_paise, 100) BETWEEN 1 AND 6 THEN 
      FLOOR(amount_paise / 100.0) * 100
    ELSE amount_paise
  END as corrected_paise,
  CASE 
    WHEN MOD(amount_paise, 100) BETWEEN 94 AND 99 THEN 
      (CEIL(amount_paise / 100.0) * 100) / 100.0
    WHEN MOD(amount_paise, 100) BETWEEN 1 AND 6 THEN 
      (FLOOR(amount_paise / 100.0) * 100) / 100.0
    ELSE amount_paise / 100.0
  END as corrected_rupees,
  created_at
FROM expenses
WHERE (MOD(amount_paise, 100) BETWEEN 94 AND 99)
   OR (MOD(amount_paise, 100) BETWEEN 1 AND 6)
ORDER BY created_at DESC;

-- Step 2: BACKUP - Create a backup of expenses before fixing
CREATE TABLE IF NOT EXISTS expenses_backup_precision_fix AS
SELECT * FROM expenses
WHERE (MOD(amount_paise, 100) BETWEEN 94 AND 99)
   OR (MOD(amount_paise, 100) BETWEEN 1 AND 6);

-- Step 3: Fix expenses ending in 94-99 paise (round UP to next rupee)
-- Example: 39997 paise (₹399.97) → 40000 paise (₹400.00)
UPDATE expenses
SET 
  amount_paise = CEIL(amount_paise / 100.0) * 100,
  updated_at = NOW()
WHERE MOD(amount_paise, 100) BETWEEN 94 AND 99
RETURNING 
  id,
  description,
  amount_paise as new_amount_paise,
  amount_paise / 100.0 as new_rupees,
  '✅ Fixed (rounded up)' as status;

-- Step 4: Fix expenses ending in 01-06 paise (round DOWN to previous rupee)
-- Example: 50001 paise (₹500.01) → 50000 paise (₹500.00)
UPDATE expenses
SET 
  amount_paise = FLOOR(amount_paise / 100.0) * 100,
  updated_at = NOW()
WHERE MOD(amount_paise, 100) BETWEEN 1 AND 6
RETURNING 
  id,
  description,
  amount_paise as new_amount_paise,
  amount_paise / 100.0 as new_rupees,
  '✅ Fixed (rounded down)' as status;

-- Step 5: Verify the fix
SELECT 
  '=== VERIFICATION AFTER FIX ===' as step,
  COUNT(*) as total_expenses,
  COUNT(CASE WHEN MOD(amount_paise, 100) BETWEEN 94 AND 99 THEN 1 END) as still_has_94_99,
  COUNT(CASE WHEN MOD(amount_paise, 100) BETWEEN 1 AND 6 THEN 1 END) as still_has_01_06,
  CASE 
    WHEN COUNT(CASE WHEN MOD(amount_paise, 100) BETWEEN 94 AND 99 THEN 1 END) = 0
     AND COUNT(CASE WHEN MOD(amount_paise, 100) BETWEEN 1 AND 6 THEN 1 END) = 0
    THEN '✅ ALL PRECISION ERRORS FIXED'
    ELSE '⚠️ SOME ERRORS REMAIN'
  END as status
FROM expenses;

-- Step 6: Show corrected expenses
SELECT 
  '=== CORRECTED EXPENSES ===' as step,
  e.id,
  e.description,
  e.amount_paise / 100.0 as current_rupees,
  b.amount_paise / 100.0 as original_rupees,
  (e.amount_paise - b.amount_paise) / 100.0 as difference_rupees,
  e.updated_at as corrected_at
FROM expenses e
JOIN expenses_backup_precision_fix b ON e.id = b.id
WHERE e.amount_paise != b.amount_paise
ORDER BY e.updated_at DESC;

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. This fixes EXISTING data that was created with the buggy code
-- 2. The CurrencyInput component has been fixed to prevent future errors
-- 3. Backup table 'expenses_backup_precision_fix' contains original values
-- 4. You can restore from backup if needed
-- 5. Run test-currency-precision.sql after this to verify
-- ============================================================================

-- Optional: Drop backup table after verification
-- DROP TABLE IF EXISTS expenses_backup_precision_fix;
