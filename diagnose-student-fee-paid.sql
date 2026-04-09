-- Diagnose why student fee_paid is showing 150 instead of 50

-- Replace this with the actual student ID from the screenshot
-- The student name is "shantya" with roll number "00"

-- Step 1: Find the student
SELECT id, full_name, roll_number, fee_paid_paise, fee_paid_paise / 100.0 as fee_paid_rupees
FROM students
WHERE full_name ILIKE '%shantya%' OR roll_number = '00'
LIMIT 5;

-- Step 2: Check all fee payments for this student
SELECT 
  fp.id,
  fp.payment_date,
  fp.amount_paise,
  fp.amount_paise / 100.0 as amount_rupees,
  fp.is_reversal,
  fp.receipt_number,
  fp.notes,
  fp.created_at
FROM fee_payments fp
WHERE fp.student_id = (
  SELECT id FROM students WHERE full_name ILIKE '%shantya%' LIMIT 1
)
ORDER BY fp.created_at ASC;

-- Step 3: Calculate what fee_paid SHOULD be
SELECT 
  s.id,
  s.full_name,
  s.fee_paid_paise / 100.0 as current_fee_paid_rupees,
  COALESCE(SUM(
    CASE 
      WHEN fp.is_reversal = false THEN fp.amount_paise
      ELSE 0
    END
  ), 0) / 100.0 as calculated_from_payments_rupees,
  (s.fee_paid_paise - COALESCE(SUM(
    CASE 
      WHEN fp.is_reversal = false THEN fp.amount_paise
      ELSE 0
    END
  ), 0)) / 100.0 as difference_rupees
FROM students s
LEFT JOIN fee_payments fp ON fp.student_id = s.id
WHERE s.full_name ILIKE '%shantya%'
GROUP BY s.id, s.full_name, s.fee_paid_paise;

-- Step 4: Fix the student's fee_paid to match actual payments
UPDATE students
SET fee_paid_paise = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN is_reversal = false THEN amount_paise
      ELSE 0
    END
  ), 0)
  FROM fee_payments
  WHERE student_id = students.id
)
WHERE full_name ILIKE '%shantya%'
RETURNING id, full_name, fee_paid_paise / 100.0 as corrected_fee_paid_rupees;
