-- FIX: Fee Payment Double Counting Issue
-- Problem: The process_fee_payment_with_allocation function manually updates student balances,
-- but the trg_update_fee_paid trigger ALSO updates them, causing double counting.
--
-- Solution: Modify the trigger to skip updates when the payment is made by the smart allocation function.
-- We'll use a special marker in the notes field to identify smart payments.

-- Step 1: Drop the old trigger
DROP TRIGGER IF EXISTS trg_update_fee_paid ON fee_payments;

-- Step 2: Create a new trigger function that skips smart payments
CREATE OR REPLACE FUNCTION update_student_fee_paid() RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a smart payment (identified by notes containing allocation info)
  -- Smart payments handle their own balance updates
  IF NEW.notes LIKE '%Applied%to previous years%' OR 
     NEW.notes LIKE '%Applied%to current year%' THEN
    RETURN NEW;
  END IF;

  -- For regular payments (non-smart), update the student balance
  IF NEW.is_reversal = FALSE THEN
    UPDATE students
    SET fee_paid_paise = fee_paid_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  ELSE
    UPDATE students
    SET fee_paid_paise = GREATEST(0, fee_paid_paise - NEW.amount_paise),
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
CREATE TRIGGER trg_update_fee_paid 
  AFTER INSERT ON fee_payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_fee_paid();

-- Step 4: Fix existing double-counted payments
-- This will recalculate fee_paid_paise for all students based on actual fee_payments records

DO $$
DECLARE
  v_student RECORD;
  v_correct_total BIGINT;
BEGIN
  FOR v_student IN 
    SELECT DISTINCT student_id 
    FROM fee_payments 
    WHERE is_reversal = FALSE
  LOOP
    -- Calculate correct total from fee_payments
    SELECT COALESCE(SUM(
      CASE 
        WHEN is_reversal = FALSE THEN amount_paise
        ELSE -amount_paise
      END
    ), 0)
    INTO v_correct_total
    FROM fee_payments
    WHERE student_id = v_student.student_id;
    
    -- Update student record with correct total
    UPDATE students
    SET fee_paid_paise = v_correct_total
    WHERE id = v_student.student_id;
    
    RAISE NOTICE 'Fixed student %: set fee_paid_paise to %', v_student.student_id, v_correct_total;
  END LOOP;
END $$;

-- Verification query
SELECT 
  s.id,
  s.full_name,
  s.fee_paid_paise / 100.0 as fee_paid_rupees,
  COALESCE(SUM(
    CASE 
      WHEN fp.is_reversal = FALSE THEN fp.amount_paise
      ELSE -fp.amount_paise
    END
  ), 0) / 100.0 as actual_payments_rupees,
  CASE 
    WHEN s.fee_paid_paise = COALESCE(SUM(
      CASE 
        WHEN fp.is_reversal = FALSE THEN fp.amount_paise
        ELSE -fp.amount_paise
      END
    ), 0) THEN '✓ CORRECT'
    ELSE '✗ MISMATCH'
  END as status
FROM students s
LEFT JOIN fee_payments fp ON fp.student_id = s.id
WHERE s.is_deleted = FALSE
GROUP BY s.id, s.full_name, s.fee_paid_paise
ORDER BY s.full_name;
