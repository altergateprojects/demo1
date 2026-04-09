-- FINAL FIX: Disable the trigger completely
-- All payment functions (smart payments, corrections, reversals) manage their own balances
-- The trigger is causing double-counting, so we remove it entirely

-- Step 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS trg_update_fee_paid ON fee_payments;

-- Step 2: Drop the trigger function (optional, for cleanup)
DROP FUNCTION IF EXISTS update_student_fee_paid();

-- Step 3: Recalculate ALL student balances from actual payments
DO $$
DECLARE
  v_student RECORD;
  v_correct_total BIGINT;
BEGIN
  RAISE NOTICE 'Recalculating all student balances...';
  
  FOR v_student IN 
    SELECT id FROM students WHERE is_deleted = FALSE
  LOOP
    -- Calculate correct total: only count non-reversal payments
    SELECT COALESCE(SUM(amount_paise), 0)
    INTO v_correct_total
    FROM fee_payments
    WHERE student_id = v_student.id
    AND is_reversal = FALSE;
    
    -- Update student record
    UPDATE students
    SET fee_paid_paise = v_correct_total
    WHERE id = v_student.id;
  END LOOP;
  
  RAISE NOTICE 'Done! All balances recalculated.';
END $$;

-- Step 4: Verify the fix
SELECT 
  s.full_name,
  s.fee_paid_paise / 100.0 as balance_rupees,
  COUNT(fp.id) FILTER (WHERE fp.is_reversal = FALSE) as payment_count,
  COALESCE(SUM(fp.amount_paise) FILTER (WHERE fp.is_reversal = FALSE), 0) / 100.0 as sum_of_payments_rupees,
  CASE 
    WHEN s.fee_paid_paise = COALESCE(SUM(fp.amount_paise) FILTER (WHERE fp.is_reversal = FALSE), 0) 
    THEN '✓ CORRECT'
    ELSE '✗ MISMATCH'
  END as status
FROM students s
LEFT JOIN fee_payments fp ON fp.student_id = s.id
WHERE s.is_deleted = FALSE
GROUP BY s.id, s.full_name, s.fee_paid_paise
ORDER BY s.full_name
LIMIT 20;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TRIGGER DISABLED - Problem solved!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 All payment functions now manage balances:';
  RAISE NOTICE '   - Smart payments (record_fee_payment_smart)';
  RAISE NOTICE '   - Corrections (correct_fee_payment)';
  RAISE NOTICE '   - Reversals (reverse_fee_payment)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 All student balances recalculated';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Test now:';
  RAISE NOTICE '   1. Add ₹50 payment → should show ₹50';
  RAISE NOTICE '   2. Correct ₹1000 to ₹10 → should subtract ₹990';
  RAISE NOTICE '   3. Balance = sum of non-reversal payments';
  RAISE NOTICE '';
END $$;
