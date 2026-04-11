-- ============================================================================
-- RUN THIS NOW - Complete Diagnostic
-- Copy and paste this entire query into Supabase SQL Editor
-- ============================================================================

-- 1. Check ALL student_dues records
SELECT 
  '=== 1. ALL STUDENT_DUES RECORDS ===' as section,
  sd.id,
  s.full_name,
  s.roll_number,
  s.status as student_status,
  sd.due_type,
  sd.amount_paise / 100.0 as amount_rupees,
  COALESCE(sd.amount_paid_paise, 0) / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  sd.is_cleared,
  sd.description
FROM student_dues sd
LEFT JOIN students s ON s.id = sd.student_id
ORDER BY sd.created_at DESC;

-- 2. Check ALL student_exit_dues records
SELECT 
  '=== 2. ALL STUDENT_EXIT_DUES RECORDS ===' as section,
  id,
  student_name,
  student_roll,
  exit_reason,
  pending_fee_paise / 100.0 as pending_fee_rupees,
  pending_pocket_money_paise / 100.0 as pending_pocket_rupees,
  total_due_paise / 100.0 as total_due_rupees,
  is_cleared,
  exit_date
FROM student_exit_dues
ORDER BY exit_date DESC;

-- 3. Calculate what Student Dues page SHOULD show
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
  '=== 3. WHAT STUDENT DUES PAGE SHOULD SHOW ===' as section,
  (SELECT pending_paise FROM regular_dues) / 100.0 as regular_dues_rupees,
  (SELECT pending_count FROM regular_dues) as regular_dues_count,
  (SELECT pending_paise FROM exit_dues) / 100.0 as exit_dues_rupees,
  (SELECT pending_count FROM exit_dues) as exit_dues_count,
  ((SELECT pending_paise FROM regular_dues) + (SELECT pending_paise FROM exit_dues)) / 100.0 as total_should_show_rupees,
  ((SELECT pending_count FROM regular_dues) + (SELECT pending_count FROM exit_dues)) as total_dues_count;

-- 4. Check specifically for yash
SELECT 
  '=== 4. YASH DETAILS ===' as section,
  s.id,
  s.full_name,
  s.roll_number,
  s.status,
  sd.id as due_id,
  sd.amount_paise / 100.0 as amount_rupees,
  sd.is_cleared,
  sd.description
FROM students s
LEFT JOIN student_dues sd ON sd.student_id = s.id
WHERE s.full_name ILIKE '%yash%'
ORDER BY sd.created_at DESC;

-- 5. Check specifically for Priya Patel
SELECT 
  '=== 5. PRIYA PATEL DETAILS ===' as section,
  s.id,
  s.full_name,
  s.roll_number,
  s.status,
  sd.id as due_id,
  sd.amount_paise / 100.0 as due_amount_rupees,
  sd.is_cleared as due_is_cleared,
  sed.id as exit_due_id,
  sed.total_due_paise / 100.0 as exit_due_rupees,
  sed.is_cleared as exit_is_cleared
FROM students s
LEFT JOIN student_dues sd ON sd.student_id = s.id
LEFT JOIN student_exit_dues sed ON sed.student_id = s.id
WHERE s.full_name ILIKE '%priya%patel%';

-- 6. Check if Priya has an exit due
SELECT 
  '=== 6. PRIYA EXIT DUE CHECK ===' as section,
  *
FROM student_exit_dues
WHERE student_name ILIKE '%priya%'
   OR student_roll IN (SELECT roll_number FROM students WHERE full_name ILIKE '%priya%');

-- 7. Summary - What's the issue?
SELECT 
  '=== 7. DIAGNOSIS ===' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM student_dues WHERE is_cleared = false) = 0 
      AND (SELECT COUNT(*) FROM student_exit_dues WHERE is_cleared = false) = 0
    THEN '❌ NO PENDING DUES FOUND - Database is empty'
    
    WHEN (SELECT COUNT(*) FROM student_dues WHERE is_cleared = false) > 0 
      AND (SELECT COUNT(*) FROM student_exit_dues WHERE is_cleared = false) = 0
    THEN '✅ Only regular dues found - No exit dues'
    
    WHEN (SELECT COUNT(*) FROM student_dues WHERE is_cleared = false) = 0 
      AND (SELECT COUNT(*) FROM student_exit_dues WHERE is_cleared = false) > 0
    THEN '✅ Only exit dues found - No regular dues'
    
    WHEN (SELECT COUNT(*) FROM student_dues WHERE is_cleared = false) > 0 
      AND (SELECT COUNT(*) FROM student_exit_dues WHERE is_cleared = false) > 0
    THEN '✅ Both regular and exit dues found - Should show combined total'
    
    ELSE '❓ Unknown state'
  END as diagnosis,
  
  (SELECT COUNT(*) FROM student_dues WHERE is_cleared = false) as regular_dues_count,
  (SELECT COUNT(*) FROM student_exit_dues WHERE is_cleared = false) as exit_dues_count,
  
  (SELECT SUM(amount_paise - COALESCE(amount_paid_paise, 0)) FROM student_dues WHERE is_cleared = false) / 100.0 as regular_dues_total_rupees,
  (SELECT SUM(total_due_paise) FROM student_exit_dues WHERE is_cleared = false) / 100.0 as exit_dues_total_rupees,
  
  ((SELECT COALESCE(SUM(amount_paise - COALESCE(amount_paid_paise, 0)), 0) FROM student_dues WHERE is_cleared = false) + 
   (SELECT COALESCE(SUM(total_due_paise), 0) FROM student_exit_dues WHERE is_cleared = false)) / 100.0 as combined_total_rupees;
