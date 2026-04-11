-- Test Script: Verify Exited Students Are Included in Dashboard Dues
-- Run this to verify the fix is working correctly

-- ============================================================================
-- 1. Find all exited students with pending fees
-- ============================================================================
SELECT 
  '1. EXITED STUDENTS WITH PENDING FEES' as test_section,
  full_name,
  roll_number,
  status,
  annual_fee_paise / 100.0 as annual_fee_rupees,
  fee_paid_paise / 100.0 as fee_paid_rupees,
  (annual_fee_paise - fee_paid_paise) / 100.0 as pending_rupees,
  academic_year_id
FROM students
WHERE status = 'exited'
  AND (annual_fee_paise - fee_paid_paise) > 0
  AND is_deleted = false
ORDER BY (annual_fee_paise - fee_paid_paise) DESC;

-- ============================================================================
-- 2. Check Priya Patel specifically
-- ============================================================================
SELECT 
  '2. PRIYA PATEL DETAILS' as test_section,
  id,
  full_name,
  roll_number,
  status,
  annual_fee_paise / 100.0 as annual_fee_rupees,
  fee_paid_paise / 100.0 as fee_paid_rupees,
  (annual_fee_paise - fee_paid_paise) / 100.0 as pending_rupees,
  current_year_pending_paise / 100.0 as current_year_pending_rupees,
  previous_years_pending_paise / 100.0 as previous_years_pending_rupees,
  academic_year_id,
  created_at,
  updated_at
FROM students
WHERE full_name ILIKE '%priya%patel%';

-- ============================================================================
-- 3. Calculate total pending fees (what dashboard should show)
-- ============================================================================
-- Current year pending (active + exited)
SELECT 
  '3A. CURRENT YEAR PENDING (ACTIVE + EXITED)' as test_section,
  COUNT(*) as student_count,
  SUM(annual_fee_paise - fee_paid_paise) / 100.0 as total_pending_rupees,
  SUM(CASE WHEN status = 'active' THEN (annual_fee_paise - fee_paid_paise) ELSE 0 END) / 100.0 as active_pending,
  SUM(CASE WHEN status = 'exited' THEN (annual_fee_paise - fee_paid_paise) ELSE 0 END) / 100.0 as exited_pending
FROM students
WHERE status IN ('active', 'exited')
  AND is_deleted = false
  AND (annual_fee_paise - fee_paid_paise) > 0
  AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = true);

-- Previous years pending (active + exited)
SELECT 
  '3B. PREVIOUS YEARS PENDING (ACTIVE + EXITED)' as test_section,
  COUNT(*) as student_count,
  SUM(annual_fee_paise - fee_paid_paise) / 100.0 as total_pending_rupees,
  SUM(CASE WHEN status = 'active' THEN (annual_fee_paise - fee_paid_paise) ELSE 0 END) / 100.0 as active_pending,
  SUM(CASE WHEN status = 'exited' THEN (annual_fee_paise - fee_paid_paise) ELSE 0 END) / 100.0 as exited_pending
FROM students
WHERE status IN ('active', 'exited')
  AND is_deleted = false
  AND (annual_fee_paise - fee_paid_paise) > 0
  AND academic_year_id != (SELECT id FROM academic_years WHERE is_current = true);

-- ============================================================================
-- 4. Check if there are exit dues records
-- ============================================================================
SELECT 
  '4. EXIT DUES RECORDS' as test_section,
  sed.id,
  sed.student_name,
  sed.student_roll,
  sed.exit_reason,
  sed.exit_date,
  sed.pending_fee_paise / 100.0 as pending_fee_rupees,
  sed.pending_pocket_money_paise / 100.0 as pending_pocket_rupees,
  sed.total_due_paise / 100.0 as total_due_rupees,
  sed.is_cleared,
  s.status as current_student_status
FROM student_exit_dues sed
LEFT JOIN students s ON s.id = sed.student_id
WHERE sed.is_cleared = false
ORDER BY sed.exit_date DESC;

-- ============================================================================
-- 5. Summary: What dashboard should display
-- ============================================================================
WITH current_year_pending AS (
  SELECT COALESCE(SUM(annual_fee_paise - fee_paid_paise), 0) as amount
  FROM students
  WHERE status IN ('active', 'exited')
    AND is_deleted = false
    AND (annual_fee_paise - fee_paid_paise) > 0
    AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = true)
),
previous_years_pending AS (
  SELECT COALESCE(SUM(annual_fee_paise - fee_paid_paise), 0) as amount
  FROM students
  WHERE status IN ('active', 'exited')
    AND is_deleted = false
    AND (annual_fee_paise - fee_paid_paise) > 0
    AND academic_year_id != (SELECT id FROM academic_years WHERE is_current = true)
),
student_dues_pending AS (
  SELECT COALESCE(SUM(amount_paise - COALESCE(amount_paid_paise, 0)), 0) as amount
  FROM student_dues
  WHERE is_cleared = false
)
SELECT 
  '5. DASHBOARD TOTALS (EXPECTED)' as test_section,
  (SELECT amount FROM current_year_pending) / 100.0 as current_year_pending_rupees,
  (SELECT amount FROM previous_years_pending) / 100.0 as previous_years_pending_rupees,
  (SELECT amount FROM student_dues_pending) / 100.0 as student_dues_pending_rupees,
  ((SELECT amount FROM current_year_pending) + 
   (SELECT amount FROM previous_years_pending) + 
   (SELECT amount FROM student_dues_pending)) / 100.0 as total_outstanding_rupees;

-- ============================================================================
-- 6. Comparison: Before vs After Fix
-- ============================================================================
WITH active_only AS (
  SELECT COALESCE(SUM(annual_fee_paise - fee_paid_paise), 0) as amount
  FROM students
  WHERE status = 'active'
    AND is_deleted = false
    AND (annual_fee_paise - fee_paid_paise) > 0
),
active_and_exited AS (
  SELECT COALESCE(SUM(annual_fee_paise - fee_paid_paise), 0) as amount
  FROM students
  WHERE status IN ('active', 'exited')
    AND is_deleted = false
    AND (annual_fee_paise - fee_paid_paise) > 0
)
SELECT 
  '6. BEFORE vs AFTER FIX' as test_section,
  (SELECT amount FROM active_only) / 100.0 as before_fix_rupees,
  (SELECT amount FROM active_and_exited) / 100.0 as after_fix_rupees,
  ((SELECT amount FROM active_and_exited) - (SELECT amount FROM active_only)) / 100.0 as difference_rupees,
  'This difference should now appear in dashboard' as note;
