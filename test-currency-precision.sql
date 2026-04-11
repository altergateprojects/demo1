-- ============================================================================
-- Test Currency Precision After Fix
-- Run this AFTER testing in the UI to verify amounts are exact
-- ============================================================================

-- Check recent expenses for precision
SELECT 
  '=== RECENT EXPENSES - PRECISION CHECK ===' as test,
  id,
  description,
  amount_paise,
  amount_paise / 100.0 as amount_rupees,
  CASE 
    WHEN amount_paise % 100 = 0 THEN '✅ Exact whole rupees'
    WHEN amount_paise % 10 = 0 THEN '✅ Exact 10 paise'
    WHEN amount_paise % 1 = 0 THEN '✅ Exact paise'
    ELSE '❌ Has fractional paise (ERROR!)'
  END as precision_check,
  created_at
FROM expenses
ORDER BY created_at DESC
LIMIT 20;

-- Check for any fractional paise (should be ZERO)
SELECT 
  '=== FRACTIONAL PAISE CHECK ===' as test,
  COUNT(*) as total_expenses,
  COUNT(CASE WHEN amount_paise % 1 != 0 THEN 1 END) as fractional_paise_count,
  CASE 
    WHEN COUNT(CASE WHEN amount_paise % 1 != 0 THEN 1 END) = 0 
    THEN '✅ NO PRECISION ERRORS'
    ELSE '❌ PRECISION ERRORS FOUND'
  END as status
FROM expenses;

-- Test specific amounts
SELECT 
  '=== SPECIFIC AMOUNT TESTS ===' as test,
  amount_paise,
  amount_paise / 100.0 as rupees,
  CASE 
    WHEN amount_paise = 1000000 THEN '✅ ₹10,000 is EXACT'
    WHEN amount_paise = 50000 THEN '✅ ₹500 is EXACT'
    WHEN amount_paise = 99999 THEN '✅ ₹999.99 is EXACT'
    WHEN amount_paise BETWEEN 999990 AND 1000010 THEN '⚠️ Close to ₹10,000 but not exact'
    ELSE 'Other amount'
  END as test_result
FROM expenses
WHERE amount_paise IN (1000000, 50000, 99999)
   OR amount_paise BETWEEN 999990 AND 1000010
ORDER BY amount_paise;

-- Show any suspicious amounts (close to round numbers but not exact)
SELECT 
  '=== SUSPICIOUS AMOUNTS (Possible Precision Errors) ===' as test,
  id,
  description,
  amount_paise,
  amount_paise / 100.0 as rupees,
  MOD(amount_paise, 100) as paise_part,
  CASE 
    WHEN MOD(amount_paise, 100) BETWEEN 94 AND 99 THEN '⚠️ Suspiciously close to next rupee'
    WHEN MOD(amount_paise, 100) BETWEEN 1 AND 6 THEN '⚠️ Suspiciously close to previous rupee'
    ELSE 'OK'
  END as warning
FROM expenses
WHERE (MOD(amount_paise, 100) BETWEEN 94 AND 99)
   OR (MOD(amount_paise, 100) BETWEEN 1 AND 6)
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- EXPECTED RESULTS AFTER FIX:
-- ============================================================================
-- 1. All amounts should have integer paise (no fractions)
-- 2. ₹10,000 should be exactly 1000000 paise
-- 3. ₹500 should be exactly 50000 paise
-- 4. No amounts ending in 94, 95, 96, 97, 98, 99 paise (unless intentional)
-- 5. Fractional paise count should be ZERO
-- ============================================================================
