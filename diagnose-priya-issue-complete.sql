-- ============================================================================
-- COMPLETE DIAGNOSTIC: Why is Priya's due not showing correctly?
-- Run this entire query in Supabase SQL Editor
-- ============================================================================

-- Step 1: Find Priya Patel's basic info
SELECT 
  '=== STEP 1: PRIYA PATEL BASIC INFO ===' as diagnostic_step,
  id as student_id,
  full_name,
  roll_number,
  status,
  annual_fee_paise / 100.0 as annual_fee_rupees,
  fee_paid_paise / 100.0 as fee_paid_rupees,
  (annual_fee_paise - fee_paid_paise) / 100.0 as pending_fee_rupees,
  is_deleted,
  academic_year_id
FROM students
WHERE full_name ILIKE '%priya%patel%';

-- Step 2: Check if Priya has any student_dues records
SELECT 
  '=== STEP 2: PRIYA STUDENT_DUES RECORDS ===' as diagnostic_step,
  sd.id,
  sd.student_id,
  s.full_name,
  sd.due_type,
  sd.amount_paise / 100.0 as amount_rupees,
  COALESCE(sd.amount_paid_paise, 0) / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  sd.is_cleared,
  sd.description
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
WHERE s.full_name ILIKE '%priya%patel%';

-- Step 3: Check if Priya has an exit due record
SELECT 
  '=== STEP 3: PRIYA EXIT DUE RECORD ===' as diagnostic_step,
  id as exit_due_id,
  student_id,
  student_name,
  student_roll,
  exit_reason,
  pending_fee_paise / 100.0 as pending_fee_rupees,
  pending_pocket_money_paise / 100.0 as pending_pocket_rupees,
  total_due_paise / 100.0 as total_due_rupees,
  is_cleared,
  exit_date
FROM student_exit_dues
WHERE student_name ILIKE '%priya%patel%'
   OR student_roll IN (SELECT roll_number FROM students WHERE full_name ILIKE '%priya%patel%');

-- Step 4: Calculate what DASHBOARD should show (from students table)
WITH dashboard_calculation AS (
  SELECT 
    id,
    full_name,
    status,
    annual_fee_paise,
    fee_paid_paise,
    (annual_fee_paise - fee_paid_paise) as pending_paise,
    academic_year_id
  FROM students
  WHERE status IN ('active', 'exited')
    AND is_deleted = false
    AND (annual_fee_paise - fee_paid_paise) > 0
)
SELECT 
  '=== STEP 4: DASHBOARD FEE DUES CALCULATION ===' as diagnostic_step,
  COUNT(*) as students_with_pending_fees,
  SUM(pending_paise) / 100.0 as total_pending_fees_rupees,
  CASE 
    WHEN EXISTS (SELECT 1 FROM dashboard_calculation WHERE full_name ILIKE '%priya%patel%')
    THEN '✅ YES - Priya IS included in dashboard fee dues'
    ELSE '❌ NO - Priya is NOT included in dashboard fee dues'
  END as is_priya_included
FROM dashboard_calculation;

-- Step 5: Calculate what STUDENT DUES PAGE should show
WITH regular_dues AS (
  SELECT 
    COALESCE(SUM(CASE 
      WHEN is_cleared = false 
      THEN (amount_paise - COALESCE(amount_paid_paise, 0))
      ELSE 0 
    END), 0) as pending_paise,
    COUNT(CASE WHEN is_cleared = false THEN 1 END) as pending_count
  FROM student_dues
),
exit_dues AS (
  SELECT 
    COALESCE(SUM(CASE 
      WHEN is_cleared = false 
      THEN total_due_paise
      ELSE 0 
    END), 0) as pending_paise,
    COUNT(CASE WHEN is_cleared = false THEN 1 END) as pending_count
  FROM student_exit_dues
)
SELECT 
  '=== STEP 5: STUDENT DUES PAGE CALCULATION ===' as diagnostic_step,
  (SELECT pending_paise FROM regular_dues) / 100.0 as regular_dues_rupees,
  (SELECT pending_count FROM regular_dues) as regular_dues_count,
  (SELECT pending_paise FROM exit_dues) / 100.0 as exit_dues_rupees,
  (SELECT pending_count FROM exit_dues) as exit_dues_count,
  ((SELECT pending_paise FROM regular_dues) + (SELECT pending_paise FROM exit_dues)) / 100.0 as total_pending_dues_rupees,
  ((SELECT pending_count FROM regular_dues) + (SELECT pending_count FROM exit_dues)) as total_dues_count;

-- Step 6: Check DASHBOARD total_pending_dues (from student_dues table)
SELECT 
  '=== STEP 6: DASHBOARD TOTAL PENDING DUES ===' as diagnostic_step,
  COUNT(*) as non_cleared_dues_count,
  SUM(amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0 as total_pending_from_student_dues_rupees
FROM student_dues
WHERE is_cleared = false;

-- Step 7: FINAL SUMMARY - Where should Priya appear?
SELECT 
  '=== STEP 7: FINAL SUMMARY ===' as diagnostic_step,
  'Dashboard Fee Dues Card' as location,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM students 
      WHERE full_name ILIKE '%priya%patel%'
        AND status IN ('active', 'exited')
        AND is_deleted = false
        AND (annual_fee_paise - fee_paid_paise) > 0
    )
    THEN '✅ Priya SHOULD appear here'
    ELSE '❌ Priya should NOT appear here'
  END as should_appear,
  (
    SELECT (annual_fee_paise - fee_paid_paise) / 100.0
    FROM students 
    WHERE full_name ILIKE '%priya%patel%'
    LIMIT 1
  ) as priya_amount_rupees

UNION ALL

SELECT 
  '=== STEP 7: FINAL SUMMARY ===' as diagnostic_step,
  'Dashboard Total Pending Dues Card' as location,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM student_dues sd
      JOIN students s ON s.id = sd.student_id
      WHERE s.full_name ILIKE '%priya%patel%'
        AND sd.is_cleared = false
    )
    THEN '✅ Priya SHOULD appear here (from student_dues)'
    WHEN EXISTS (
      SELECT 1 FROM student_exit_dues
      WHERE student_name ILIKE '%priya%patel%'
        AND is_cleared = false
    )
    THEN '✅ Priya SHOULD appear here (from exit_dues)'
    ELSE '❌ Priya should NOT appear here'
  END as should_appear,
  COALESCE(
    (SELECT SUM(amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0
     FROM student_dues sd
     JOIN students s ON s.id = sd.student_id
     WHERE s.full_name ILIKE '%priya%patel%'
       AND sd.is_cleared = false),
    (SELECT total_due_paise / 100.0
     FROM student_exit_dues
     WHERE student_name ILIKE '%priya%patel%'
       AND is_cleared = false
     LIMIT 1),
    0
  ) as priya_amount_rupees

UNION ALL

SELECT 
  '=== STEP 7: FINAL SUMMARY ===' as diagnostic_step,
  'Student Dues Page' as location,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM student_dues sd
      JOIN students s ON s.id = sd.student_id
      WHERE s.full_name ILIKE '%priya%patel%'
        AND sd.is_cleared = false
    )
    THEN '✅ Priya SHOULD appear here (from student_dues)'
    WHEN EXISTS (
      SELECT 1 FROM student_exit_dues
      WHERE student_name ILIKE '%priya%patel%'
        AND is_cleared = false
    )
    THEN '✅ Priya SHOULD appear here (from exit_dues)'
    ELSE '❌ Priya should NOT appear here'
  END as should_appear,
  COALESCE(
    (SELECT SUM(amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0
     FROM student_dues sd
     JOIN students s ON s.id = sd.student_id
     WHERE s.full_name ILIKE '%priya%patel%'
       AND sd.is_cleared = false),
    (SELECT total_due_paise / 100.0
     FROM student_exit_dues
     WHERE student_name ILIKE '%priya%patel%'
       AND is_cleared = false
     LIMIT 1),
    0
  ) as priya_amount_rupees;

-- Step 8: Show ALL pending dues to verify totals
SELECT 
  '=== STEP 8: ALL PENDING DUES (VERIFICATION) ===' as diagnostic_step,
  'Regular Dues' as source,
  s.full_name,
  s.roll_number,
  sd.due_type,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as pending_rupees
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
WHERE sd.is_cleared = false

UNION ALL

SELECT 
  '=== STEP 8: ALL PENDING DUES (VERIFICATION) ===' as diagnostic_step,
  'Exit Dues' as source,
  student_name as full_name,
  student_roll as roll_number,
  'exit_due' as due_type,
  total_due_paise / 100.0 as pending_rupees
FROM student_exit_dues
WHERE is_cleared = false

ORDER BY full_name;
