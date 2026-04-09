-- Fix: Correction function should update student balance
-- Currently, reversals create negative entries but don't update student.fee_paid_paise

-- Update the correct_fee_payment function to properly update student balances
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
  
  -- Step 1: Reverse the original amount from student balance
  UPDATE students
  SET fee_paid_paise = GREATEST(0, fee_paid_paise - v_payment.amount_paise)
  WHERE id = v_payment.student_id;
  
  -- Step 2: Create reversal payment entry
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
    received_by,
    notes
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
    p_corrected_by,
    'Reversal of payment ' || v_payment.receipt_number
  )
  RETURNING id INTO v_reversal_id;
  
  -- Step 3: Add the new corrected amount to student balance
  UPDATE students
  SET fee_paid_paise = fee_paid_paise + p_new_amount_paise
  WHERE id = p_new_student_id;
  
  -- Step 4: Create new corrected payment entry
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
    received_by,
    notes
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
    p_corrected_by,
    'Corrected payment (original: ' || v_payment.receipt_number || ')'
  )
  RETURNING id INTO v_new_payment_id;
  
  v_result := json_build_object(
    'success', true,
    'reversal_id', v_reversal_id,
    'new_payment_id', v_new_payment_id,
    'original_payment_id', p_payment_id,
    'original_amount', v_payment.amount_paise,
    'new_amount', p_new_amount_paise,
    'message', 'Payment corrected successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the simple reversal function
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
  
  -- Step 1: Reverse the amount from student balance
  UPDATE students
  SET fee_paid_paise = GREATEST(0, fee_paid_paise - v_payment.amount_paise)
  WHERE id = v_payment.student_id;
  
  -- Step 2: Create reversal payment entry (negative amount)
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
    received_by,
    notes
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
    p_reversed_by,
    'Reversal: ' || p_reversal_reason
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION reverse_fee_payment TO authenticated;
GRANT EXECUTE ON FUNCTION correct_fee_payment TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Correction functions updated to properly update student balances';
  RAISE NOTICE '📝 Reversals now subtract from fee_paid_paise';
  RAISE NOTICE '📝 Corrections now subtract old amount and add new amount';
END $$;
