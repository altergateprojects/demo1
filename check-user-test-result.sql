-- Check the expense the user just tested
SELECT 
  '=== USER TEST RESULT ===' as info,
  id,
  description,
  amount_paise,
  amount_paise / 100.0 as amount_rupees,
  MOD(amount_paise, 100) as paise_part,
  CASE 
    WHEN amount_paise = 40000 THEN '✅ CORRECT - ₹400.00 (40000 paise)'
    WHEN amount_paise = 39997 THEN '❌ ERROR - ₹399.97 (39997 paise) - OLD DATA'
    WHEN amount_paise = 1000000 THEN '✅ CORRECT - ₹10,000.00 (1000000 paise)'
    WHEN amount_paise = 999994 THEN '❌ ERROR - ₹9,999.94 (999994 paise) - OLD DATA'
    ELSE 'Other amount'
  END as status,
  created_at,
  updated_at
FROM expenses
ORDER BY created_at DESC
LIMIT 10;

-- Count precision errors
SELECT 
  '=== PRECISION ERROR COUNT ===' as info,
  COUNT(*) as total_expenses,
  COUNT(CASE WHEN MOD(amount_paise, 100) BETWEEN 94 AND 99 THEN 1 END) as errors_94_99,
  COUNT(CASE WHEN MOD(amount_paise, 100) BETWEEN 1 AND 6 THEN 1 END) as errors_01_06,
  COUNT(CASE WHEN MOD(amount_paise, 100) BETWEEN 94 AND 99 OR MOD(amount_paise, 100) BETWEEN 1 AND 6 THEN 1 END) as total_errors
FROM expenses;
