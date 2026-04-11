-- Debug: Why is Student Dues page showing wrong total?

-- 1. Check ALL student_dues records
SELECT 
  '1. ALL STUDENT DUES' as section,
  sd.id,
  s.full_name,
  s.roll_number,
  sd.due_type,
  sd.description,
  sd.amount_paise / 100.0 as amount_rupees,
  COALESCE(sd.amount_paid_paise, 0) / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  sd.is_cleared,
  sd.created_at
FROM student_dues sd
LEFT JOIN students s ON s.id = sd.student_id
ORDER BY sd.created_at DESC;

-- 2. Calculate what stats SHOULD show
SELECT 
  '2. STATS CALCULATION' as section,
  COUNT(*) as total_dues_count,
  COUNT(CASE WHEN is_cleared = false THEN 1 END) as pending_count,
  COUNT(CASE WHEN is_cleared = true THEN 1 END) as cleared_count,
  SUM(CASE 
    WHEN is_cleared = false 
    THEN (amount_paise - COALESCE(amount_paid_paise, 0))
    ELSE 0 
  END) / 100.0 as total_pending_rupees,
  SUM(CASE 
    WHEN is_cleared = true 
    THEN amount_paise
    ELSE 0 
  END) / 100.0 as total_cleared_rupees
FROM student_dues;

-- 3. Check specifically for yash and Priya
SELECT 
  '3. YASH AND PRIYA DUES' as section,
  s.full_name,
  sd.id as due_id,
  sd.amount_paise / 100.0 as amount_rupees,
  COALESCE(sd.amount_paid_paise, 0) / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  sd.is_cleared,
  sd.due_type,
  sd.description
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
WHERE s.full_name ILIKE '%yash%' 
   OR s.full_name ILIKE '%priya%'
ORDER BY s.full_name;

-- 4. Check if Priya's due is cleared
SELECT 
  '4. IS PRIYA DUE CLEARED?' as section,
  sd.id,
  sd.is_cleared,
  sd.amount_paise / 100.0 as amount_rupees,
  COALESCE(sd.amount_paid_paise, 0) / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  CASE 
    WHEN sd.is_cleared = true THEN '❌ CLEARED - Will not show in pending'
    WHEN (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) <= 0 THEN '❌ FULLY PAID - No remaining amount'
    ELSE '✅ SHOULD SHOW IN PENDING'
  END as status
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
WHERE s.full_name ILIKE '%priya%patel%';

-- 5. Check exit dues
SELECT 
  '5. EXIT DUES' as section,
  id,
  student_name,
  exit_reason,
  pending_fee_paise / 100.0 as pending_fee_rupees,
  pending_pocket_money_paise / 100.0 as pending_pocket_rupees,
  total_due_paise / 100.0 as total_due_rupees,
  is_cleared
FROM student_exit_dues
WHERE is_cleared = false;

-- 6. Simulate getDuesSummaryStats calculation
WITH dues_calc AS (
  SELECT 
    due_type,
    amount_paise,
    amount_paid_paise,
    is_cleared,
    (amount_paise - COALESCE(amount_paid_paise, 0)) as remaining_paise
  FROM student_dues
)
SELECT 
  '6. SIMULATED STATS' as section,
  SUM(CASE 
    WHEN is_cleared = false 
    THEN remaining_paise 
    ELSE 0 
  END) / 100.0 as total_pending_dues_rupees,
  SUM(CASE 
    WHEN is_cleared = false AND due_type = 'fee'
    THEN remaining_paise 
    ELSE 0 
  END) / 100.0 as pending_fee_dues_rupees,
  SUM(CASE 
    WHEN is_cleared = false AND due_type = 'pocket_money'
    THEN remaining_paise 
    ELSE 0 
  END) / 100.0 as pending_pocket_dues_rupees,
  SUM(CASE 
    WHEN is_cleared = true 
    THEN amount_paise 
    ELSE 0 
  END) / 100.0 as total_cleared_dues_rupees
FROM dues_calc;

-- 7. Check if there are duplicate dues
SELECT 
  '7. CHECK FOR DUPLICATES' as section,
  s.full_name,
  COUNT(*) as number_of_dues,
  SUM(sd.amount_paise) / 100.0 as total_amount_rupees,
  STRING_AGG(sd.id::text, ', ') as due_ids
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
WHERE sd.is_cleared = false
GROUP BY s.full_name
HAVING COUNT(*) > 1;
