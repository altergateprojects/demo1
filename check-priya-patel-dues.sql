-- Check Priya Patel's student record and dues
SELECT 
  id,
  full_name,
  roll_number,
  status,
  annual_fee_paise,
  fee_paid_paise,
  current_year_pending_paise,
  previous_years_pending_paise,
  (annual_fee_paise - fee_paid_paise) as calculated_pending
FROM students
WHERE full_name ILIKE '%priya%patel%';

-- Check if there are any student_dues records
SELECT 
  sd.*,
  s.full_name,
  s.status as student_status
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
WHERE s.full_name ILIKE '%priya%patel%';

-- Check fee payments
SELECT 
  fp.*,
  s.full_name,
  s.status as student_status
FROM fee_payments fp
JOIN students s ON s.id = fp.student_id
WHERE s.full_name ILIKE '%priya%patel%'
ORDER BY fp.payment_date DESC;
