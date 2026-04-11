-- Complete Diagnostic for Priya Patel
-- Run this to understand her complete financial status

-- ============================================================================
-- 1. Basic Student Information
-- ============================================================================
SELECT 
  '=== PRIYA PATEL: BASIC INFO ===' as section,
  id,
  full_name,
  roll_number,
  status,
  gender,
  date_of_birth,
  admission_date,
  is_deleted,
  created_at,
  updated_at
FROM students
WHERE full_name ILIKE '%priya%patel%';

-- ============================================================================
-- 2. Financial Summary
-- ============================================================================
SELECT 
  '=== PRIYA PATEL: FINANCIAL SUMMARY ===' as section,
  full_name,
  status,
  -- Current Year Fees
  annual_fee_paise / 100.0 as annual_fee_rupees,
  fee_paid_paise / 100.0 as fee_paid_rupees,
  (annual_fee_paise - fee_paid_paise) / 100.0 as current_year_pending_rupees,
  
  -- Previous Years
  previous_years_pending_paise / 100.0 as previous_years_pending_rupees,
  
  -- Pocket Money
  pocket_money_paise / 100.0 as pocket_money_rupees,
  
  -- Total Pending
  ((annual_fee_paise - fee_paid_paise) + 
   COALESCE(previous_years_pending_paise, 0)) / 100.0 as total_fee_pending_rupees,
  
  -- Academic Year
  academic_year_id,
  standard_id
FROM students
WHERE full_name ILIKE '%priya%patel%';

-- ============================================================================
-- 3. Fee Payment History
-- ============================================================================
SELECT 
  '=== PRIYA PATEL: FEE PAYMENT HISTORY ===' as section,
  fp.id,
  fp.payment_date,
  fp.amount_paise / 100.0 as amount_rupees,
  fp.payment_method,
  fp.reference_number,
  fp.notes,
  fp.is_reversal,
  u.full_name as received_by,
  ay.year_label as academic_year
FROM fee_payments fp
JOIN students s ON s.id = fp.student_id
LEFT JOIN user_profiles u ON u.id = fp.received_by
LEFT JOIN academic_years ay ON ay.id = fp.academic_year_id
WHERE s.full_name ILIKE '%priya%patel%'
ORDER BY fp.payment_date DESC;

-- ============================================================================
-- 4. Student Dues Records
-- ============================================================================
SELECT 
  '=== PRIYA PATEL: STUDENT DUES ===' as section,
  sd.id,
  sd.due_type,
  sd.description,
  sd.amount_paise / 100.0 as amount_rupees,
  sd.amount_paid_paise / 100.0 as paid_rupees,
  (sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)) / 100.0 as remaining_rupees,
  sd.due_date,
  sd.is_cleared,
  sd.cleared_date,
  ay.year_label as academic_year,
  cu.full_name as created_by,
  clu.full_name as cleared_by
FROM student_dues sd
JOIN students s ON s.id = sd.student_id
LEFT JOIN academic_years ay ON ay.id = sd.academic_year_id
LEFT JOIN user_profiles cu ON cu.id = sd.created_by
LEFT JOIN user_profiles clu ON clu.id = sd.cleared_by
WHERE s.full_name ILIKE '%priya%patel%'
ORDER BY sd.created_at DESC;

-- ============================================================================
-- 5. Exit Due Record (if exists)
-- ============================================================================
SELECT 
  '=== PRIYA PATEL: EXIT DUE ===' as section,
  sed.id,
  sed.student_name,
  sed.student_roll,
  sed.exit_reason,
  sed.exit_date,
  sed.pending_fee_paise / 100.0 as pending_fee_rupees,
  sed.pending_pocket_money_paise / 100.0 as pending_pocket_rupees,
  sed.total_due_paise / 100.0 as total_due_rupees,
  sed.is_cleared,
  sed.cleared_date,
  sed.notes,
  cu.full_name as created_by,
  clu.full_name as cleared_by
FROM student_exit_dues sed
LEFT JOIN user_profiles cu ON cu.id = sed.created_by
LEFT JOIN user_profiles clu ON clu.id = sed.cleared_by
WHERE sed.student_name ILIKE '%priya%patel%'
   OR sed.student_roll IN (
     SELECT roll_number FROM students WHERE full_name ILIKE '%priya%patel%'
   );

-- ============================================================================
-- 6. Pocket Money Transactions
-- ============================================================================
SELECT 
  '=== PRIYA PATEL: POCKET MONEY TRANSACTIONS ===' as section,
  pmt.id,
  pmt.transaction_date,
  pmt.transaction_type,
  pmt.amount_paise / 100.0 as amount_rupees,
  pmt.balance_after_paise / 100.0 as balance_after_rupees,
  pmt.description,
  u.full_name as created_by
FROM pocket_money_transactions pmt
JOIN students s ON s.id = pmt.student_id
LEFT JOIN user_profiles u ON u.id = pmt.created_by
WHERE s.full_name ILIKE '%priya%patel%'
ORDER BY pmt.transaction_date DESC
LIMIT 20;

-- ============================================================================
-- 7. Standard and Academic Year Info
-- ============================================================================
SELECT 
  '=== PRIYA PATEL: STANDARD & YEAR ===' as section,
  s.full_name,
  st.name as standard_name,
  st.sort_order,
  ay.year_label as academic_year,
  ay.start_date,
  ay.end_date,
  ay.is_current
FROM students s
LEFT JOIN standards st ON st.id = s.standard_id
LEFT JOIN academic_years ay ON ay.id = s.academic_year_id
WHERE s.full_name ILIKE '%priya%patel%';

-- ============================================================================
-- 8. Should This Student Appear in Dashboard?
-- ============================================================================
WITH priya_data AS (
  SELECT 
    id,
    full_name,
    status,
    annual_fee_paise,
    fee_paid_paise,
    (annual_fee_paise - fee_paid_paise) as pending_paise,
    is_deleted,
    academic_year_id
  FROM students
  WHERE full_name ILIKE '%priya%patel%'
)
SELECT 
  '=== DASHBOARD INCLUSION CHECK ===' as section,
  full_name,
  status,
  pending_paise / 100.0 as pending_rupees,
  is_deleted,
  CASE 
    WHEN is_deleted = true THEN '❌ NO - Student is deleted'
    WHEN pending_paise <= 0 THEN '❌ NO - No pending fees'
    WHEN status NOT IN ('active', 'exited') THEN '❌ NO - Status is not active or exited'
    ELSE '✅ YES - Should appear in dashboard'
  END as should_appear_in_dashboard,
  CASE 
    WHEN status IN ('active', 'exited') AND pending_paise > 0 AND is_deleted = false 
    THEN 'This amount should be included in dashboard totals'
    ELSE 'This amount should NOT be included in dashboard totals'
  END as note
FROM priya_data;

-- ============================================================================
-- 9. Total Amount That Should Show in Dashboard
-- ============================================================================
SELECT 
  '=== TOTAL FOR DASHBOARD ===' as section,
  COUNT(*) as number_of_students_named_priya_patel,
  SUM(CASE 
    WHEN status IN ('active', 'exited') 
      AND (annual_fee_paise - fee_paid_paise) > 0 
      AND is_deleted = false 
    THEN (annual_fee_paise - fee_paid_paise) 
    ELSE 0 
  END) / 100.0 as total_pending_for_dashboard_rupees
FROM students
WHERE full_name ILIKE '%priya%patel%';
