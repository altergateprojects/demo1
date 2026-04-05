-- Fix the get_student_due_payment_history function
-- The issue was using up.user_id instead of up.id

DROP FUNCTION IF EXISTS get_student_due_payment_history(UUID);

CREATE OR REPLACE FUNCTION get_student_due_payment_history(p_student_due_id UUID)
RETURNS TABLE (
  id UUID,
  payment_amount_paise BIGINT,
  payment_date DATE,
  payment_method VARCHAR,
  payment_reference VARCHAR,
  notes TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sdp.id,
    sdp.payment_amount_paise,
    sdp.payment_date,
    sdp.payment_method,
    sdp.payment_reference,
    sdp.notes,
    up.full_name as created_by_name,
    sdp.created_at
  FROM student_due_payments sdp
  LEFT JOIN user_profiles up ON up.id = sdp.created_by
  WHERE sdp.student_due_id = p_student_due_id
  ORDER BY sdp.payment_date DESC, sdp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
