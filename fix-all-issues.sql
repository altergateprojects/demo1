-- COMPREHENSIVE FIX FOR ALL ISSUES
-- Run this script to fix fee calculations and ensure triggers work properly

-- 1. Fix fee calculation for all students
-- Recalculate fee_paid_paise based on actual fee_payments
UPDATE students 
SET fee_paid_paise = COALESCE(
  (SELECT SUM(
    CASE 
      WHEN fp.is_reversal = false THEN fp.amount_paise
      ELSE -fp.amount_paise
    END
  )
  FROM fee_payments fp 
  WHERE fp.student_id = students.id
  ), 0
);

-- 2. Ensure the trigger function is working correctly
-- Drop and recreate the trigger function to fix any issues
DROP TRIGGER IF EXISTS trg_update_fee_paid ON fee_payments;
DROP FUNCTION IF EXISTS update_student_fee_paid();

CREATE OR REPLACE FUNCTION update_student_fee_paid() RETURNS TRIGGER AS $$
BEGIN
  -- Update student's fee_paid_paise based on the payment
  IF NEW.is_reversal = FALSE THEN
    -- Regular payment - add to fee_paid_paise
    UPDATE students
    SET fee_paid_paise = fee_paid_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  ELSE
    -- Reversal payment - subtract from fee_paid_paise (but don't go below 0)
    UPDATE students
    SET fee_paid_paise = GREATEST(0, fee_paid_paise - NEW.amount_paise),
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trg_update_fee_paid 
  AFTER INSERT ON fee_payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_fee_paid();

-- 3. Verify the fix worked
SELECT 
  s.full_name,
  s.roll_number,
  st.name as standard,
  s.annual_fee_paise / 100.0 as annual_fee_rupees,
  s.fee_paid_paise / 100.0 as fee_paid_rupees,
  (s.annual_fee_paise - s.fee_paid_paise) / 100.0 as pending_fee_rupees,
  (SELECT COUNT(*) FROM fee_payments fp WHERE fp.student_id = s.id AND fp.is_reversal = false) as payment_count,
  (SELECT SUM(fp.amount_paise) FROM fee_payments fp WHERE fp.student_id = s.id AND fp.is_reversal = false) / 100.0 as total_payments_rupees
FROM students s
LEFT JOIN standards st ON s.standard_id = st.id
WHERE s.is_deleted = false
ORDER BY s.full_name
LIMIT 10;

-- Success message
SELECT 'Fee calculation fix completed successfully!' as status;