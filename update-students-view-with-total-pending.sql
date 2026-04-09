-- Update students_with_fee_status view to include previous years pending
-- Previous years pending = SUM of fee_due_paise from student_year_snapshots
-- Total pending = previous years pending + current year pending

-- Drop the existing view first
DROP VIEW IF EXISTS students_with_fee_status;

-- Recreate the view with new columns
CREATE VIEW students_with_fee_status AS
SELECT 
  s.id,
  s.full_name,
  s.roll_number,
  s.gender,
  s.dob,
  s.admission_date,
  s.guardian_name,
  s.phone,
  s.alt_phone,
  s.address,
  s.status,
  s.standard_id,
  s.academic_year_id,
  s.annual_fee_paise,
  s.fee_paid_paise,
  s.pocket_money_paise,
  s.is_deleted,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.aadhaar_last_4,
  st.name as standard_name,
  st.sort_order as standard_sort_order,
  ay.year_label as academic_year_label,
  -- Calculate previous years pending from snapshots
  COALESCE((
    SELECT SUM(fee_due_paise)
    FROM student_year_snapshots
    WHERE student_id = s.id
  ), 0) as previous_years_pending_paise,
  -- Current year pending
  (s.annual_fee_paise - s.fee_paid_paise) as current_year_pending_paise,
  -- Total pending (previous + current)
  COALESCE((
    SELECT SUM(fee_due_paise)
    FROM student_year_snapshots
    WHERE student_id = s.id
  ), 0) + (s.annual_fee_paise - s.fee_paid_paise) as total_pending_paise,
  -- Fee status based on current year only
  CASE 
    WHEN s.annual_fee_paise > s.fee_paid_paise THEN 'pending'
    WHEN s.annual_fee_paise = s.fee_paid_paise THEN 'paid'
    WHEN s.annual_fee_paise < s.fee_paid_paise THEN 'overpaid'
    ELSE 'unknown'
  END as fee_status,
  (s.annual_fee_paise - s.fee_paid_paise) as pending_fee_paise,
  CASE 
    WHEN s.pocket_money_paise < 0 THEN 'negative'
    WHEN s.pocket_money_paise = 0 THEN 'zero'
    WHEN s.pocket_money_paise > 0 THEN 'positive'
    ELSE 'unknown'
  END as pocket_money_status
FROM students s
LEFT JOIN standards st ON s.standard_id = st.id
LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
WHERE s.is_deleted = false;

-- Grant access to authenticated users
GRANT SELECT ON students_with_fee_status TO authenticated;

-- Test the view
SELECT 
  full_name,
  roll_number,
  standard_name,
  previous_years_pending_paise / 100.0 as previous_years_pending,
  current_year_pending_paise / 100.0 as current_year_pending,
  total_pending_paise / 100.0 as total_pending,
  fee_paid_paise / 100.0 as fee_paid,
  annual_fee_paise / 100.0 as annual_fee
FROM students_with_fee_status 
WHERE previous_years_pending_paise > 0
ORDER BY standard_sort_order, roll_number
LIMIT 10;

-- Success message
SELECT 'Students view updated with total pending calculation!' as status;
