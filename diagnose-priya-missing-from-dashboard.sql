-- Diagnose why Priya Patel's ₹4,000 is not in dashboard total

-- 1. Check Priya's student record
SELECT 
  '1. PRIYA STUDENT RECORD' as section,
  id,
  full_name,
  roll_number,
  status,
  is_deleted,
  academic_year_id,
  annual_fee_paise / 100.0 as annual_fee_rupees,
  fee_paid_paise / 100.0 as fee_paid_rupees,
  (annual_fee_paise - fee_paid_paise) / 100.0 as pending_from_students_table_rupees
FROM students
WHERE full_name ILIKE '%priya%patel%';

-- 2. Check what academic year is current
SELECT 
  '2. CURRENT ACADEMIC YEAR' as section,
  id,
  year_label,
  is_current,
  start_date,
  end_date
FROM academic_years
WHERE is_current = true;

-- 3. Check if Priya is in current or previous year
SELECT 
  '3. PRIYA ACADEMIC YEAR CHECK' as section,
  s.full_name,
  s.academic_year_id,
  ay.year_label,
  ay.is_current,
  CASE 
    WHEN ay.is_current = true THEN 'Current Year'
    ELSE 'Previous Year'
  END as year_type
FROM students s
LEFT JOIN academic_years ay ON ay.id = s.academic_year_id
WHERE s.full_name ILIKE '%priya%patel%';

-- 4. Check student_dues table for Priya
SELECT 
  '4. STUDENT DUES TABLE' as section,
  sd.id,
  sd.student_id,
  sd.due_type,
  sd.description,
  sd.amount_paise / 100.0 as amount_rupees,
  sd.amount_paid_paise / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  sd.is_cleared,
  sd.academic_year_id,
  ay.year_label
FROM student_dues sd
LEFT JOIN academic_years ay ON ay.id = sd.academic_year_id
WHERE sd.student_id IN (SELECT id FROM students WHERE full_name ILIKE '%priya%patel%');

-- 5. Check exit dues table
SELECT 
  '5. EXIT DUES TABLE' as section,
  sed.id,
  sed.student_id,
  sed.student_name,
  sed.exit_reason,
  sed.pending_fee_paise / 100.0 as pending_fee_rupees,
  sed.pending_pocket_money_paise / 100.0 as pending_pocket_rupees,
  sed.total_due_paise / 100.0 as total_due_rupees,
  sed.is_cleared
FROM student_exit_dues sed
WHERE sed.student_name ILIKE '%priya%patel%'
   OR sed.student_id IN (SELECT id FROM students WHERE full_name ILIKE '%priya%patel%');

-- 6. Calculate what SHOULD be in dashboard
WITH current_year AS (
  SELECT id FROM academic_years WHERE is_current = true
),
priya_in_students AS (
  SELECT 
    SUM(CASE 
      WHEN s.academic_year_id = (SELECT id FROM current_year) 
      THEN (s.annual_fee_paise - s.fee_paid_paise)
      ELSE 0
    END) as current_year_pending,
    SUM(CASE 
      WHEN s.academic_year_id != (SELECT id FROM current_year) 
      THEN (s.annual_fee_paise - s.fee_paid_paise)
      ELSE 0
    END) as previous_years_pending
  FROM students s
  WHERE s.full_name ILIKE '%priya%patel%'
    AND s.status IN ('active', 'exited')
    AND s.is_deleted = false
    AND (s.annual_fee_paise - s.fee_paid_paise) > 0
),
priya_in_dues AS (
  SELECT 
    COALESCE(SUM(sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)), 0) as dues_pending
  FROM student_dues sd
  WHERE sd.student_id IN (SELECT id FROM students WHERE full_name ILIKE '%priya%patel%')
    AND sd.is_cleared = false
)
SELECT 
  '6. WHAT SHOULD BE IN DASHBOARD' as section,
  COALESCE((SELECT current_year_pending FROM priya_in_students), 0) / 100.0 as priya_current_year_rupees,
  COALESCE((SELECT previous_years_pending FROM priya_in_students), 0) / 100.0 as priya_previous_years_rupees,
  COALESCE((SELECT dues_pending FROM priya_in_dues), 0) / 100.0 as priya_student_dues_rupees,
  (COALESCE((SELECT current_year_pending FROM priya_in_students), 0) + 
   COALESCE((SELECT previous_years_pending FROM priya_in_students), 0) + 
   COALESCE((SELECT dues_pending FROM priya_in_dues), 0)) / 100.0 as priya_total_should_show_rupees;

-- 7. Check ALL students to see dashboard calculation
WITH current_year AS (
  SELECT id FROM academic_years WHERE is_current = true
)
SELECT 
  '7. ALL STUDENTS DASHBOARD CALCULATION' as section,
  COUNT(*) as total_students_with_pending,
  SUM(CASE 
    WHEN s.academic_year_id = (SELECT id FROM current_year) 
    THEN (s.annual_fee_paise - s.fee_paid_paise)
    ELSE 0
  END) / 100.0 as current_year_total_rupees,
  SUM(CASE 
    WHEN s.academic_year_id != (SELECT id FROM current_year) 
    THEN (s.annual_fee_paise - s.fee_paid_paise)
    ELSE 0
  END) / 100.0 as previous_years_total_rupees,
  SUM(s.annual_fee_paise - s.fee_paid_paise) / 100.0 as all_years_total_rupees
FROM students s
WHERE s.status IN ('active', 'exited')
  AND s.is_deleted = false
  AND (s.annual_fee_paise - s.fee_paid_paise) > 0;

-- 8. Check student_dues total
SELECT 
  '8. STUDENT DUES TOTAL' as section,
  COUNT(*) as total_dues_records,
  SUM(amount_paise - COALESCE(amount_paid_paise, 0)) / 100.0 as total_pending_rupees
FROM student_dues
WHERE is_cleared = false;
