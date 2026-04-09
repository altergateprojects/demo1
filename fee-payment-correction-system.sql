-- FEE PAYMENT CORRECTION SYSTEM
-- Allows correcting mistakes in fee payments with full audit trail

-- Drop existing functions if they exist (to allow parameter name changes)
DROP FUNCTION IF EXISTS reverse_fee_payment(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS correct_fee_payment(UUID, TEXT, UUID, BIGINT, DATE, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_payment_history_with_reversals(UUID, UUID);

-- Function to reverse a fee payment
CREATE OR REPLACE FUNCTION reverse_fee_payment(
  p_payment_id UUID,
  p_reversal_reason TEXT,
  p_reversed_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_payment RECORD;
  v_reversal_id UUID;
  v_result JSON;
BEGIN
  -- Get the original payment
  SELECT * INTO v_payment 
  FROM fee_payments 
  WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  -- Check if already reversed
  IF v_payment.is_reversal THEN
    RAISE EXCEPTION 'Cannot reverse a reversal payment';
  END IF;
  
  -- Check if this payment has already been reversed
  IF EXISTS (
    SELECT 1 FROM fee_payments 
    WHERE reversed_payment_id = p_payment_id 
    AND is_reversal = true
  ) THEN
    RAISE EXCEPTION 'This payment has already been reversed';
  END IF;
  
  -- Create reversal payment (negative amount)
  INSERT INTO fee_payments (
    student_id,
    academic_year_id,
    amount_paise,
    payment_date,
    payment_method,
    receipt_number,
    reference_number,
    bank_name,
    is_reversal,
    reversed_payment_id,
    reversal_reason,
    reversed_by,
    received_by
  ) VALUES (
    v_payment.student_id,
    v_payment.academic_year_id,
    -v_payment.amount_paise,  -- Negative amount to reverse
    CURRENT_DATE,
    v_payment.payment_method,
    'REV-' || v_payment.receipt_number,
    v_payment.reference_number,
    v_payment.bank_name,
    true,
    p_payment_id,
    p_reversal_reason,
    p_reversed_by,
    p_reversed_by
  )
  RETURNING id INTO v_reversal_id;
  
  v_result := json_build_object(
    'success', true,
    'reversal_id', v_reversal_id,
    'original_payment_id', p_payment_id,
    'amount_reversed', v_payment.amount_paise,
    'message', 'Payment reversed successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to correct a fee payment (reverse + create new)
CREATE OR REPLACE FUNCTION correct_fee_payment(
  p_payment_id UUID,
  p_correction_reason TEXT,
  p_new_student_id UUID,
  p_new_amount_paise BIGINT,
  p_new_payment_date DATE,
  p_new_payment_method TEXT,
  p_corrected_by UUID,
  p_new_reference_number TEXT DEFAULT NULL,
  p_new_bank_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_payment RECORD;
  v_reversal_id UUID;
  v_new_payment_id UUID;
  v_result JSON;
BEGIN
  -- Get the original payment
  SELECT * INTO v_payment 
  FROM fee_payments 
  WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  -- Check if already reversed
  IF v_payment.is_reversal THEN
    RAISE EXCEPTION 'Cannot correct a reversal payment';
  END IF;
  
  -- Check if this payment has already been reversed
  IF EXISTS (
    SELECT 1 FROM fee_payments 
    WHERE reversed_payment_id = p_payment_id 
    AND is_reversal = true
  ) THEN
    RAISE EXCEPTION 'This payment has already been reversed/corrected';
  END IF;
  
  -- Create reversal payment
  INSERT INTO fee_payments (
    student_id,
    academic_year_id,
    amount_paise,
    payment_date,
    payment_method,
    receipt_number,
    reference_number,
    bank_name,
    is_reversal,
    reversed_payment_id,
    reversal_reason,
    reversed_by,
    received_by
  ) VALUES (
    v_payment.student_id,
    v_payment.academic_year_id,
    -v_payment.amount_paise,
    CURRENT_DATE,
    v_payment.payment_method,
    'REV-' || v_payment.receipt_number,
    v_payment.reference_number,
    v_payment.bank_name,
    true,
    p_payment_id,
    'CORRECTION: ' || p_correction_reason,
    p_corrected_by,
    p_corrected_by
  )
  RETURNING id INTO v_reversal_id;
  
  -- Create new corrected payment
  INSERT INTO fee_payments (
    student_id,
    academic_year_id,
    amount_paise,
    payment_date,
    payment_method,
    receipt_number,
    reference_number,
    bank_name,
    is_reversal,
    reversed_payment_id,
    reversal_reason,
    received_by
  ) VALUES (
    p_new_student_id,
    v_payment.academic_year_id,
    p_new_amount_paise,
    p_new_payment_date,
    p_new_payment_method,
    'COR-' || v_payment.receipt_number,
    p_new_reference_number,
    p_new_bank_name,
    false,
    NULL,
    NULL,
    p_corrected_by
  )
  RETURNING id INTO v_new_payment_id;
  
  v_result := json_build_object(
    'success', true,
    'reversal_id', v_reversal_id,
    'new_payment_id', v_new_payment_id,
    'original_payment_id', p_payment_id,
    'message', 'Payment corrected successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment history with reversals
CREATE OR REPLACE FUNCTION get_payment_history_with_reversals(
  p_student_id UUID,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  student_id UUID,
  student_name TEXT,
  academic_year_id UUID,
  amount_paise BIGINT,
  payment_date DATE,
  payment_method TEXT,
  receipt_number TEXT,
  is_reversal BOOLEAN,
  reversed_payment_id UUID,
  reversal_reason TEXT,
  reversed_by UUID,
  reversed_by_name TEXT,
  received_by UUID,
  recorded_by_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.student_id,
    s.full_name as student_name,
    fp.academic_year_id,
    fp.amount_paise,
    fp.payment_date,
    fp.payment_method,
    fp.receipt_number,
    fp.is_reversal,
    fp.reversed_payment_id,
    fp.reversal_reason,
    fp.reversed_by,
    rbp.full_name as reversed_by_name,
    fp.received_by,
    recp.full_name as recorded_by_name,
    fp.created_at
  FROM fee_payments fp
  JOIN students s ON fp.student_id = s.id
  LEFT JOIN user_profiles rbp ON fp.reversed_by = rbp.id
  LEFT JOIN user_profiles recp ON fp.received_by = recp.id
  WHERE fp.student_id = p_student_id
    AND (p_academic_year_id IS NULL OR fp.academic_year_id = p_academic_year_id)
  ORDER BY fp.created_at DESC, fp.payment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION reverse_fee_payment TO authenticated;
GRANT EXECUTE ON FUNCTION correct_fee_payment TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_history_with_reversals TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fee Payment Correction System created successfully!';
  RAISE NOTICE '📝 Functions: reverse_fee_payment, correct_fee_payment, get_payment_history_with_reversals';
  RAISE NOTICE '🔄 Supports: Full reversal, Correction (reverse + new payment), Complete audit trail';
END $$;
