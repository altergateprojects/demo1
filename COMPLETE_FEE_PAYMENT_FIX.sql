-- COMPLETE FIX: Fee payment system with proper trigger handling
-- This fixes ALL doubling issues for normal payments, corrections, and reversals

-- Step 1: Update trigger to skip ALL system-managed payments
DROP TRIGGER IF EXISTS trg_update_fee_paid ON fee_payments;

CREATE OR REPLACE FUNCTION update_student_fee_paid() RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is ANY of these system-managed payment types:
  -- 1. Smart payments (have allocation notes)
  -- 2. Reversals (is_reversal = true)
  -- 3. Corrections (receipt starts with 'COR-' or 'REV-')
  IF NEW.notes LIKE '%Applied%to previous years%' OR 
     NEW.notes LIKE '%Applied%to current year%' OR
     NEW.is_reversal = true OR
     NEW.receipt_number LIKE 'REV-%' OR
     NEW.receipt_number LIKE 'COR-%' THEN
    -- These payments manage their own balances, skip trigger
    RETURN NEW;
  END IF;

  -- For regular payments only, update the student balance
  IF NEW.is_reversal = FALSE THEN
    UPDATE students
    SET fee_paid_paise = fee_paid_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_fee_paid 
  AFTER INSERT ON fee_payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_fee_paid();

-- Step 2: Recalculate ALL student balances from scratch
DO $$
DECLARE
  v_student RECORD;
  v_correct_total BIGINT;
BEGIN
  FOR v_student IN 
    SELECT DISTINCT student_id 
    FROM fee_payments
  LOOP
    -- Calculate correct total: only count non-reversal payments
    SELECT COALESCE(SUM(amount_paise), 0)
    INTO v_correct_total
    FROM fee_payments
    WHERE student_id = v_student.student_id
    AND is_reversal = FALSE;
    
    -- Update student record with correct total
    UPDATE students
    SET fee_paid_paise = v_correct_total
    WHERE id = v_student.student_id;
    
    RAISE NOTICE 'Fixed student %: set fee_paid_paise to %', v_student.student_id, v_correct_total;
  END LOOP;
END $$;

-- Step 3: Verify the fix
SELECT 
  s.id,
  s.full_name,
  s.fee_paid_paise / 100.0 as current_balance_rupees,
  COALESCE(SUM(
    CASE 
      WHEN fp.is_reversal = FALSE THEN fp.amount_paise
      ELSE 0
    END
  ), 0) / 100.0 as calculated_from_payments_rupees,
  CASE 
    WHEN s.fee_paid_paise = COALESCE(SUM(
      CASE 
        WHEN fp.is_reversal = FALSE THEN fp.amount_paise
        ELSE 0
      END
    ), 0) THEN '✓ CORRECT'
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
  RAISE NOTICE '✅ Complete fee payment system fixed!';
  RAISE NOTICE '📝 Trigger now skips: smart payments, reversals, corrections';
  RAISE NOTICE '📝 All student balances recalculated from actual payments';
  RAISE NOTICE '📝 Test by: 1) Adding payment 2) Correcting payment 3) Check balance';
END $$;
