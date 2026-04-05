-- Fix fee calculation for all students
-- This will recalculate fee_paid_paise based on actual fee_payments

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

-- Show updated fee summary for verification
SELECT 
  s.full_name,
  s.roll_number,
  st.name as standard,
  s.annual_fee_paise / 100.0 as annual_fee_rupees,
  s.fee_paid_paise / 100.0 as fee_paid_rupees,
  (s.annual_fee_paise - s.fee_paid_paise) / 100.0 as pending_fee_rupees,
  (SELECT COUNT(*) FROM fee_payments fp WHERE fp.student_id = s.id) as payment_count
FROM students s
LEFT JOIN standards st ON s.standard_id = st.id
WHERE s.is_deleted = false
ORDER BY s.full_name;