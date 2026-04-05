-- Debug dashboard data issues

-- 1. Check if we have academic years
SELECT 'Academic Years:' as section;
SELECT id, name, is_current, start_date, end_date 
FROM academic_years 
ORDER BY start_date DESC;

-- 2. Check if we have students
SELECT 'Students Count by Academic Year:' as section;
SELECT 
  ay.name as academic_year,
  COUNT(s.id) as total_students,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_students,
  COUNT(CASE WHEN s.is_deleted = false THEN 1 END) as not_deleted_students
FROM academic_years ay
LEFT JOIN students s ON s.academic_year_id = ay.id
GROUP BY ay.id, ay.name
ORDER BY ay.start_date DESC;

-- 3. Check student fees data
SELECT 'Student Fees Summary:' as section;
SELECT 
  COUNT(*) as total_students,
  SUM(annual_fee_paise) / 100.0 as total_annual_fees,
  SUM(fee_paid_paise) / 100.0 as total_paid_fees,
  SUM(annual_fee_paise - fee_paid_paise) / 100.0 as total_pending_fees,
  AVG(annual_fee_paise) / 100.0 as avg_annual_fee
FROM students 
WHERE status = 'active' AND is_deleted = false;

-- 4. Check pocket money data
SELECT 'Pocket Money Summary:' as section;
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN pocket_money_paise < 0 THEN 1 END) as negative_balance_students,
  SUM(pocket_money_paise) / 100.0 as total_pocket_money,
  MIN(pocket_money_paise) / 100.0 as min_balance,
  MAX(pocket_money_paise) / 100.0 as max_balance
FROM students 
WHERE status = 'active' AND is_deleted = false;

-- 5. Check fee payments
SELECT 'Fee Payments Summary:' as section;
SELECT 
  COUNT(*) as total_payments,
  SUM(amount_paise) / 100.0 as total_collected,
  MIN(payment_date) as earliest_payment,
  MAX(payment_date) as latest_payment
FROM fee_payments 
WHERE is_reversal = false;

-- 6. Check if teachers table exists
SELECT 'Teachers Count:' as section;
SELECT 
  COUNT(*) as total_teachers,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_teachers
FROM teachers 
WHERE is_deleted = false;