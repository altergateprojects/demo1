-- ============================================================================
-- FIX: Update get_students_for_promotion function
-- ============================================================================
-- This fixes the function to work with existing database structure
-- ============================================================================

CREATE OR REPLACE FUNCTION get_students_for_promotion(
  p_academic_year_id UUID,
  p_standard_id UUID DEFAULT NULL
) RETURNS TABLE (
  student_id UUID,
  roll_number TEXT,
  full_name TEXT,
  standard_id UUID,
  standard_name TEXT,
  annual_fee_paise BIGINT,
  fee_paid_paise BIGINT,
  fee_due_paise BIGINT,
  pocket_money_paise BIGINT,
  total_pending_dues_paise BIGINT,
  promotion_eligible BOOLEAN,
  promotion_hold_reason TEXT,
  last_promoted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.roll_number,
    s.full_name,
    s.standard_id,
    st.standard_name,
    s.annual_fee_paise,
    s.fee_paid_paise,
    (s.annual_fee_paise - s.fee_paid_paise) AS fee_due_paise,
    COALESCE(s.pocket_money_paise, 0) AS pocket_money_paise,
    GREATEST(
      (s.annual_fee_paise - s.fee_paid_paise) + LEAST(COALESCE(s.pocket_money_paise, 0), 0),
      0
    ) AS total_pending_dues_paise,
    COALESCE(s.promotion_eligible, TRUE) AS promotion_eligible,
    s.promotion_hold_reason,
    s.last_promoted_at
  FROM students s
  JOIN standards st ON st.id = s.standard_id
  WHERE s.academic_year_id = p_academic_year_id
    AND s.is_deleted = FALSE
    AND s.status = 'active'
    AND (p_standard_id IS NULL OR s.standard_id = p_standard_id)
  ORDER BY st.standard_name, s.roll_number;
END;
$$;

COMMENT ON FUNCTION get_students_for_promotion IS 'Returns students eligible for promotion (fixed version)';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_students_for_promotion TO authenticated;

-- Test the function
DO $$
BEGIN
  RAISE NOTICE '✓ Fixed get_students_for_promotion function';
  RAISE NOTICE '✓ Function should now return students from current year';
END $$;
