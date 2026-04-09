-- Debug student dues calculation
SELECT 
  '=== STUDENT DUES BREAKDOWN ===' as info;

-- Show all pending dues
SELECT 
  id,
  student_id,
  due_type,
  description,
  amount_paise,
  amount_paid_paise,
  (amount_paise - COALESCE(amount_paid_paise, 0)) as remaining_paise,
  status,
  due_date
FROM student_dues
WHERE status = 'pending'
ORDER BY due_date DESC;

-- Calculate total pending
SELECT 
  '=== TOTAL PENDING CALCULATION ===' as info;

SELECT 
  COUNT(*) as total_pending_dues,
  SUM(amount_paise) as total_amount_paise,
  SUM(COALESCE(amount_paid_paise, 0)) as total_paid_paise,
  SUM(amount_paise - COALESCE(amount_paid_paise, 0)) as total_remaining_paise,
  SUM(amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0 as total_remaining_rupees
FROM student_dues
WHERE status = 'pending';

-- Check if there are dues with status other than 'pending'
SELECT 
  '=== DUES BY STATUS ===' as info;

SELECT 
  status,
  COUNT(*) as count,
  SUM(amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0 as remaining_rupees
FROM student_dues
GROUP BY status;

-- Check for partially paid dues
SELECT 
  '=== PARTIALLY PAID DUES ===' as info;

SELECT 
  id,
  student_id,
  due_type,
  amount_paise / 100.0 as amount_rupees,
  COALESCE(amount_paid_paise, 0) / 100.0 as paid_rupees,
  (amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  status
FROM student_dues
WHERE amount_paid_paise > 0 AND amount_paid_paise < amount_paise;
