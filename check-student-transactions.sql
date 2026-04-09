-- Check all transaction data for a specific student
-- Replace 'STUDENT_ID_HERE' with actual student ID

-- 1. Check fee_payments table
SELECT 
  'fee_payments' as source,
  COUNT(*) as count,
  SUM(amount_paise) as total_amount_paise
FROM fee_payments
WHERE student_id = 'STUDENT_ID_HERE';

-- 2. Show sample fee_payments
SELECT 
  id,
  student_id,
  amount_paise,
  payment_date,
  payment_method,
  payment_reference,
  receipt_number
FROM fee_payments
WHERE student_id = 'STUDENT_ID_HERE'
ORDER BY payment_date DESC
LIMIT 5;

-- 3. Check pocket_money_transactions table (if exists)
SELECT 
  'pocket_money_transactions' as source,
  COUNT(*) as count,
  SUM(amount_paise) as total_amount_paise
FROM pocket_money_transactions
WHERE student_id = 'STUDENT_ID_HERE';

-- 4. Show sample pocket_money_transactions
SELECT 
  id,
  student_id,
  transaction_type,
  amount_paise,
  transaction_date,
  description
FROM pocket_money_transactions
WHERE student_id = 'STUDENT_ID_HERE'
ORDER BY transaction_date DESC
LIMIT 5;

-- 5. Check student_due_payments
SELECT 
  'student_due_payments' as source,
  COUNT(*) as count,
  SUM(payment_amount_paise) as total_amount_paise
FROM student_due_payments sdp
JOIN student_dues sd ON sd.id = sdp.student_due_id
WHERE sd.student_id = 'STUDENT_ID_HERE';

-- 6. Show sample student_due_payments
SELECT 
  sdp.id,
  sdp.payment_amount_paise,
  sdp.payment_date,
  sdp.payment_method,
  sd.due_type,
  sd.student_id
FROM student_due_payments sdp
JOIN student_dues sd ON sd.id = sdp.student_due_id
WHERE sd.student_id = 'STUDENT_ID_HERE'
ORDER BY sdp.payment_date DESC
LIMIT 5;

-- 7. Check student's current pocket money balance
SELECT 
  id,
  full_name,
  pocket_money_paise,
  fee_paid_paise,
  annual_fee_paise
FROM students
WHERE id = 'STUDENT_ID_HERE';
