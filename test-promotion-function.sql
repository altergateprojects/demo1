-- ============================================================================
-- TEST: Verify get_students_for_promotion function works
-- ============================================================================

-- Get the current academic year ID
DO $$
DECLARE
  v_current_year_id UUID;
BEGIN
  SELECT id INTO v_current_year_id
  FROM academic_years
  WHERE is_current = TRUE
  LIMIT 1;
  
  RAISE NOTICE 'Current Year ID: %', v_current_year_id;
END $$;

-- Test the function directly
SELECT 
  student_id,
  roll_number,
  full_name,
  standard_name,
  annual_fee_paise,
  fee_paid_paise,
  pocket_money_paise,
  total_pending_dues_paise,
  promotion_eligible
FROM get_students_for_promotion(
  (SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1),
  NULL
)
LIMIT 10;

-- If the above returns students, the function works!
-- If it returns nothing, there's an issue with the function
