-- Check if payment logs are being created

-- 1. Check if student_due_payments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'student_due_payments'
) as table_exists;

-- 2. Check all payment records
SELECT 
  sdp.id,
  sdp.student_due_id,
  sdp.payment_amount_paise,
  sdp.payment_date,
  sdp.payment_method,
  sdp.payment_reference,
  sdp.notes,
  sdp.created_at,
  up.full_name as created_by_name
FROM student_due_payments sdp
LEFT JOIN user_profiles up ON up.id = sdp.created_by
ORDER BY sdp.created_at DESC
LIMIT 20;

-- 3. Check student_dues with payment info
SELECT 
  id,
  student_id,
  due_type,
  amount_paise,
  amount_paid_paise,
  is_cleared,
  created_at
FROM student_dues
WHERE amount_paid_paise > 0 OR is_cleared = true
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if the function exists
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'get_student_due_payment_history'
) as function_exists;
