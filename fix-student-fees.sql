-- Fix Student Annual Fees
-- Run this if you have students with zero annual fees

-- Update existing students to have correct annual fees based on their standard
UPDATE students 
SET annual_fee_paise = fc.annual_fee_paise,
    updated_at = NOW()
FROM fee_configurations fc
WHERE students.academic_year_id = fc.academic_year_id 
  AND students.standard_id = fc.standard_id
  AND fc.gender = 'all'
  AND fc.is_active = true
  AND students.annual_fee_paise = 0;

-- Also make description optional in pocket money table if it exists
ALTER TABLE pocket_money_transactions ALTER COLUMN description DROP NOT NULL;

-- Check the results
SELECT 
  s.full_name,
  s.roll_number,
  st.name as standard,
  s.annual_fee_paise / 100 as annual_fee_rupees,
  s.fee_paid_paise / 100 as fee_paid_rupees,
  (s.annual_fee_paise - s.fee_paid_paise) / 100 as pending_fee_rupees
FROM students s
JOIN standards st ON s.standard_id = st.id
WHERE s.is_deleted = false
ORDER BY st.sort_order, s.roll_number;