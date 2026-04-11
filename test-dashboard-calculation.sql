-- Test Dashboard Calculation
-- This should match what the dashboard displays

-- Get current academic year
WITH current_year AS (
  SELECT id FROM academic_years WHERE is_current = true LIMIT 1
)

-- 1. Current Year Pending Fees (from students table)
SELECT 
  '1. CURRENT YEAR PENDING (students table)' as calculation,
  COUNT(*) as student_count,
  SUM(annual_fee_paise - fee_paid_paise) / 100.0 as total_rupees,
  'This should match "Fee Dues" card' as note
FROM students
WHERE academic_year_id = (SELECT id FROM current_year)
  AND status IN ('active', 'exited')
  AND is_deleted = false
  AND (annual_fee_paise - fee_paid_paise) > 0;

-- 2. Previous Years Pending Fees (from students table)
SELECT 
  '2. PREVIOUS YEARS PENDING (students table)' as calculation,
  COUNT(*) as student_count,
  SUM(annual_fee_paise - fee_paid_paise) / 100.0 as total_rupees,
  'This is for previous years' as note
FROM students
WHERE academic_year_id != (SELECT id FROM current_year)
  AND status IN ('active', 'exited')
  AND is_deleted = false
  AND (annual_fee_paise - fee_paid_paise) > 0;

-- 3. Student Dues (from student_dues table)
SELECT 
  '3. STUDENT DUES (student_dues table)' as calculation,
  COUNT(*) as dues_count,
  SUM(amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0 as total_rupees,
  'This should include Priya Patel' as note
FROM student_dues
WHERE (amount_paise - COALESCE(amount_paid_paise, 0)) > 0;

-- 4. Total Outstanding (sum of all three)
WITH current_year AS (
  SELECT id FROM academic_years WHERE is_current = true LIMIT 1
),
current_year_fees AS (
  SELECT COALESCE(SUM(annual_fee_paise - fee_paid_paise), 0) as amount
  FROM students
  WHERE academic_year_id = (SELECT id FROM current_year)
    AND status IN ('active', 'exited')
    AND is_deleted = false
    AND (annual_fee_paise - fee_paid_paise) > 0
),
previous_years_fees AS (
  SELECT COALESCE(SUM(annual_fee_paise - fee_paid_paise), 0) as amount
  FROM students
  WHERE academic_year_id != (SELECT id FROM current_year)
    AND status IN ('active', 'exited')
    AND is_deleted = false
    AND (annual_fee_paise - fee_paid_paise) > 0
),
student_dues_total AS (
  SELECT COALESCE(SUM(amount_paise - COALESCE(amount_paid_paise, 0)), 0) as amount
  FROM student_dues
  WHERE (amount_paise - COALESCE(amount_paid_paise, 0)) > 0
)
SELECT 
  '4. TOTAL OUTSTANDING' as calculation,
  (SELECT amount FROM current_year_fees) / 100.0 as current_year_rupees,
  (SELECT amount FROM previous_years_fees) / 100.0 as previous_years_rupees,
  (SELECT amount FROM student_dues_total) / 100.0 as student_dues_rupees,
  ((SELECT amount FROM current_year_fees) + 
   (SELECT amount FROM previous_years_fees) + 
   (SELECT amount FROM student_dues_total)) / 100.0 as total_outstanding_rupees,
  'This should match "Total Pending" card' as note;

-- 5. List all student_dues records
SELECT 
  '5. ALL STUDENT DUES RECORDS' as section,
  sd.id,
  s.full_name,
  s.roll_number,
  s.status as student_status,
  sd.due_type,
  sd.description,
  sd.amount_paise / 100.0 as amount_rupees,
  COALESCE(sd.amount_paid_paise, 0) / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  sd.is_cleared,
  ay.year_label
FROM student_dues sd
LEFT JOIN students s ON s.id = sd.student_id
LEFT JOIN academic_years ay ON ay.id = sd.academic_year_id
ORDER BY (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) DESC;

-- 6. Check if Priya's due is in student_dues
SELECT 
  '6. PRIYA IN STUDENT_DUES' as section,
  sd.*,
  s.full_name,
  s.status
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
WHERE s.full_name ILIKE '%priya%patel%';
