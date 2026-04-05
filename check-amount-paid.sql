-- Check if amount_paid_paise is being updated

-- 1. Check student_dues table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_dues' 
AND column_name IN ('amount_paise', 'amount_paid_paise', 'is_cleared');

-- 2. Check current dues with payment info
SELECT 
  id,
  student_id,
  due_type,
  amount_paise,
  amount_paid_paise,
  is_cleared,
  created_at
FROM student_dues
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check payment logs
SELECT 
  COUNT(*) as total_payments,
  SUM(payment_amount_paise) as total_payment_amount
FROM student_due_payments;

-- 4. Check if payments match dues
SELECT 
  sd.id as due_id,
  sd.amount_paise,
  sd.amount_paid_paise,
  COALESCE(SUM(sdp.payment_amount_paise), 0) as actual_payments_sum
FROM student_dues sd
LEFT JOIN student_due_payments sdp ON sdp.student_due_id = sd.id
GROUP BY sd.id, sd.amount_paise, sd.amount_paid_paise
HAVING sd.amount_paid_paise != COALESCE(SUM(sdp.payment_amount_paise), 0);
