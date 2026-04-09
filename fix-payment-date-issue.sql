-- Quick fix for payment_date null constraint issue
-- Run this to update the smart payment functions with proper payment_date handling

-- Drop existing functions first
DROP FUNCTION IF EXISTS record_fee_payment_smart;
DROP FUNCTION IF EXISTS process_fee_payment_with_allocation;

-- Recreate with proper payment_date parameter
CREATE OR REPLACE FUNCTION process_fee_payment_with_allocation(
  p_student_id UUID,
  p_amount_paise BIGINT,
  p_payment_method TEXT DEFAULT 'cash',
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT '',
  p_received_by UUID DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_student RECORD;
  v_current_year_id UUID;
  v_previous_years_pending BIGINT := 0;
  v_current_year_pending BIGINT := 0;
  v_remaining_amount BIGINT;
  v_applied_to_previous BIGINT := 0;
  v_applied_to_current BIGINT := 0;
  v_added_to_pocket BIGINT := 0;
  v_receipt_number TEXT;
  v_payment_id UUID;
  v_snapshots RECORD;
  v_result JSON;
BEGIN
  -- Get current academic year
  SELECT id INTO v_current_year_id FROM academic_years WHERE is_current = true LIMIT 1;
  
  -- Get student info
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- Calculate previous years pending from snapshots
  SELECT COALESCE(SUM(dues_carried_forward_paise), 0) 
  INTO v_previous_years_pending
  FROM student_year_snapshots 
  WHERE student_id = p_student_id;
  
  -- Calculate current year pending
  v_current_year_pending := GREATEST(0, v_student.annual_fee_paise - v_student.fee_paid_paise);
  
  -- Start allocation process
  v_remaining_amount := p_amount_paise;
  
  -- Step 1: Apply to previous years debt first (FIFO - oldest debt first)
  IF v_previous_years_pending > 0 AND v_remaining_amount > 0 THEN
    -- Apply payment to previous years (proportionally across all snapshots)
    v_applied_to_previous := LEAST(v_remaining_amount, v_previous_years_pending);
    v_remaining_amount := v_remaining_amount - v_applied_to_previous;
    
    -- Update snapshots proportionally
    UPDATE student_year_snapshots 
    SET dues_carried_forward_paise = GREATEST(0, 
      dues_carried_forward_paise - ROUND(
        (dues_carried_forward_paise::DECIMAL / v_previous_years_pending) * v_applied_to_previous
      )
    )
    WHERE student_id = p_student_id 
    AND dues_carried_forward_paise > 0;
  END IF;
  
  -- Step 2: Apply remaining to current year
  IF v_current_year_pending > 0 AND v_remaining_amount > 0 THEN
    v_applied_to_current := LEAST(v_remaining_amount, v_current_year_pending);
    v_remaining_amount := v_remaining_amount - v_applied_to_current;
    
    -- Update current year fee_paid
    UPDATE students 
    SET fee_paid_paise = fee_paid_paise + v_applied_to_current
    WHERE id = p_student_id;
  END IF;
  
  -- Step 3: Add any remaining amount to pocket money
  IF v_remaining_amount > 0 THEN
    v_added_to_pocket := v_remaining_amount;
    
    UPDATE students 
    SET pocket_money_paise = pocket_money_paise + v_remaining_amount
    WHERE id = p_student_id;
  END IF;
  
  -- Generate receipt number
  SELECT year_label INTO v_receipt_number FROM academic_years WHERE id = v_current_year_id;
  v_receipt_number := v_receipt_number || '-' || LPAD(EXTRACT(epoch FROM NOW())::TEXT, 10, '0');
  
  -- Record the payment in fee_payments table
  INSERT INTO fee_payments (
    student_id,
    academic_year_id,
    amount_paise,
    payment_method,
    payment_date,
    receipt_number,
    reference_number,
    bank_name,
    notes,
    received_by
  ) VALUES (
    p_student_id,
    v_current_year_id,
    p_amount_paise,
    p_payment_method,
    p_payment_date,
    v_receipt_number,
    p_reference_number,
    p_bank_name,
    COALESCE(p_notes, '') || 
    CASE 
      WHEN v_applied_to_previous > 0 THEN ' | Applied ₹' || (v_applied_to_previous/100.0) || ' to previous years'
      ELSE ''
    END ||
    CASE 
      WHEN v_applied_to_current > 0 THEN ' | Applied ₹' || (v_applied_to_current/100.0) || ' to current year'
      ELSE ''
    END ||
    CASE 
      WHEN v_added_to_pocket > 0 THEN ' | Added ₹' || (v_added_to_pocket/100.0) || ' to pocket money'
      ELSE ''
    END,
    p_received_by
  ) RETURNING id INTO v_payment_id;
  
  -- Return detailed result
  v_result := json_build_object(
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_number,
    'total_amount_paise', p_amount_paise,
    'allocation', json_build_object(
      'applied_to_previous_years_paise', v_applied_to_previous,
      'applied_to_current_year_paise', v_applied_to_current,
      'added_to_pocket_money_paise', v_added_to_pocket
    ),
    'balances_after_payment', json_build_object(
      'previous_years_pending_paise', v_previous_years_pending - v_applied_to_previous,
      'current_year_pending_paise', v_current_year_pending - v_applied_to_current,
      'new_pocket_money_balance_paise', v_student.pocket_money_paise + v_added_to_pocket
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create wrapper function
CREATE OR REPLACE FUNCTION record_fee_payment_smart(
  p_student_id UUID,
  p_amount_paise BIGINT,
  p_payment_method TEXT DEFAULT 'cash',
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT '',
  p_reference_number TEXT DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Process payment with allocation
  SELECT process_fee_payment_with_allocation(
    p_student_id,
    p_amount_paise,
    p_payment_method,
    p_payment_date,
    p_notes,
    v_user_id,
    p_reference_number,
    p_bank_name
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_fee_payment_with_allocation TO authenticated;
GRANT EXECUTE ON FUNCTION record_fee_payment_smart TO authenticated;

COMMENT ON FUNCTION process_fee_payment_with_allocation IS 'Intelligently allocates fee payments: first to previous years debt, then current year, then pocket money - with payment_date support';
COMMENT ON FUNCTION record_fee_payment_smart IS 'Wrapper function for fee payment allocation with authentication and payment_date support';