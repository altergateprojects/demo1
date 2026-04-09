-- Manual fix: Set student fee_paid to exactly ₹50 (5000 paise)

-- Find the student first
SELECT id, full_name, roll_number, fee_paid_paise / 100.0 as current_paid
FROM students
WHERE full_name ILIKE '%shantya%';

-- Manually set to 5000 paise (₹50)
UPDATE students
SET fee_paid_paise = 5000  -- Exactly ₹50
WHERE full_name ILIKE '%shantya%'
RETURNING id, full_name, fee_paid_paise / 100.0 as corrected_paid;

-- Verify
SELECT 
  s.full_name,
  s.fee_paid_paise / 100.0 as fee_paid_rupees,
  fp.payment_date,
  fp.amount_paise / 100.0 as payment_rupees,
  fp.is_reversal,
  fp.receipt_number
FROM students s
LEFT JOIN fee_payments fp ON fp.student_id = s.id
WHERE s.full_name ILIKE '%shantya%'
ORDER BY fp.created_at;
