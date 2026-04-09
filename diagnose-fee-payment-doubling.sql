-- Diagnostic query to check if fee payments are being doubled

-- Check recent fee payments
SELECT 
  fp.id,
  fp.student_id,
  s.full_name,
  fp.amount_paise,
  fp.amount_paise / 100.0 as amount_rupees,
  fp.payment_date,
  fp.payment_method,
  fp.receipt_number,
  fp.notes,
  fp.created_at
FROM fee_payments fp
JOIN students s ON s.id = fp.student_id
WHERE fp.is_reversal = false
ORDER BY fp.created_at DESC
LIMIT 20;

-- Check if there are duplicate entries
SELECT 
  student_id,
  amount_paise,
  payment_date,
  receipt_number,
  COUNT(*) as count
FROM fee_payments
WHERE is_reversal = false
GROUP BY student_id, amount_paise, payment_date, receipt_number
HAVING COUNT(*) > 1;

-- Check total fees collected for current academic year
SELECT 
  ay.year_label,
  COUNT(fp.id) as payment_count,
  SUM(fp.amount_paise) as total_paise,
  SUM(fp.amount_paise) / 100.0 as total_rupees
FROM fee_payments fp
JOIN academic_years ay ON ay.id = fp.academic_year_id
WHERE fp.is_reversal = false
  AND ay.is_current = true
GROUP BY ay.year_label;

-- Check a specific student's payment history
-- Replace with actual student_id if you have one
SELECT 
  fp.payment_date,
  fp.amount_paise,
  fp.amount_paise / 100.0 as amount_rupees,
  fp.receipt_number,
  fp.notes,
  s.fee_paid_paise,
  s.fee_paid_paise / 100.0 as total_paid_rupees
FROM fee_payments fp
JOIN students s ON s.id = fp.student_id
WHERE fp.student_id = (
  SELECT id FROM students 
  WHERE is_deleted = false 
  ORDER BY created_at DESC 
  LIMIT 1
)
AND fp.is_reversal = false
ORDER BY fp.payment_date DESC;
