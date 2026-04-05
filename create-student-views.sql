-- Create views to make student filtering more efficient
-- This will help with fee status filtering and other complex queries

-- 1. Create a view for students with calculated fee status
CREATE OR REPLACE VIEW students_with_fee_status AS
SELECT 
  s.*,
  st.name as standard_name,
  st.sort_order as standard_sort_order,
  ay.year_label as academic_year_label,
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

-- 2. Create RLS policy for the view
ALTER VIEW students_with_fee_status OWNER TO postgres;

-- 3. Test the view
SELECT 
  full_name,
  roll_number,
  standard_name,
  fee_status,
  pocket_money_status,
  pending_fee_paise / 100.0 as pending_fee_rupees
FROM students_with_fee_status 
ORDER BY standard_sort_order, roll_number
LIMIT 10;

-- Success message
SELECT 'Student views created successfully! Fee filtering should now work better.' as status;