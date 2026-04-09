-- Add student status validation to payment functions
-- This prevents graduated, withdrawn, or deleted students from receiving payments

-- Drop and recreate the smart payment function with status validation
DROP FUNCTION IF EXISTS record_fee_payment_smart CASCADE;
DROP FUNCTION IF EXISTS process_fee_payment_with_allocation CASCADE;

-- Recreate with status validation
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
  v_result JSON;
BEGIN
  -- Get student info
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- ✅ NEW: Validate student status
  IF v_student.status != 'active' THEN
    RAISE EXCEPTION 'Cannot process payment for % student. Only active students can receive payments.', v_student.status;
  END IF;
  
  -- ✅ NEW: Check if student is deleted
  IF v_student.is_deleted = TRUE THEN
    RAISE EXCEPTION 'Cannot process payment for deleted student';
  END IF;
  
  -- Get current academic year
  SELECT id INTO v_current_year_id FROM academic_years WHERE is_current = true LIMIT 1;
  
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
  
  -- Step 3: Add remaining to pocket money
  IF v_remaining_amount > 0 THEN
    v_added_to_pocket := v_remaining_amount;
    
    UPDATE students 
    SET pocket_money_paise = pocket_money_paise + v_added_to_pocket
    WHERE id = p_student_id;
  END IF;
  
  -- Generate receipt number
  SELECT generate_receipt_number(
    (SELECT year_label FROM academic_years WHERE id = v_current_year_id)
  ) INTO v_receipt_number;
  
  -- Create fee payment record
  INSERT INTO fee_payments (
    student_id,
    amount_paise,
    payment_method,
    payment_date,
    receipt_number,
    notes,
    received_by,
    reference_number,
    bank_name,
    is_reversal,
    academic_year_id
  ) VALUES (
    p_student_id,
    p_amount_paise,
    p_payment_method,
    p_payment_date,
    v_receipt_number,
    p_notes,
    COALESCE(p_received_by, auth.uid()),
    p_reference_number,
    p_bank_name,
    FALSE,
    v_current_year_id
  ) RETURNING id INTO v_payment_id;
  
  -- Build result JSON
  v_result := json_build_object(
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_number,
    'allocation', json_build_object(
      'applied_to_previous_years_paise', v_applied_to_previous,
      'applied_to_current_year_paise', v_applied_to_current,
      'added_to_pocket_money_paise', v_added_to_pocket
    ),
    'balances_after_payment', json_build_object(
      'previous_years_pending_paise', v_previous_years_pending - v_applied_to_previous,
      'current_year_pending_paise', v_current_year_pending - v_applied_to_current,
      'pocket_money_paise', v_student.pocket_money_paise + v_added_to_pocket
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_result JSON;
BEGIN
  -- Process payment with allocation
  SELECT process_fee_payment_with_allocation(
    p_student_id,
    p_amount_paise,
    p_payment_method,
    p_payment_date,
    p_notes,
    auth.uid(),
    p_reference_number,
    p_bank_name
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_fee_payment_with_allocation TO authenticated;
GRANT EXECUTE ON FUNCTION record_fee_payment_smart TO authenticated;

-- Add status validation to pocket money function
CREATE OR REPLACE FUNCTION record_pocket_money_transaction(
  p_student_id UUID,
  p_amount_paise BIGINT,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT '',
  p_transaction_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
DECLARE
  v_student RECORD;
  v_transaction_id UUID;
BEGIN
  -- Get student info
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- ✅ NEW: Validate student status
  IF v_student.status != 'active' THEN
    RAISE EXCEPTION 'Cannot process pocket money transaction for % student. Only active students can have transactions.', v_student.status;
  END IF;
  
  -- ✅ NEW: Check if student is deleted
  IF v_student.is_deleted = TRUE THEN
    RAISE EXCEPTION 'Cannot process transaction for deleted student';
  END IF;
  
  -- Create transaction record
  INSERT INTO pocket_money_transactions (
    student_id,
    amount_paise,
    transaction_type,
    description,
    transaction_date,
    recorded_by
  ) VALUES (
    p_student_id,
    p_amount_paise,
    p_transaction_type,
    p_description,
    p_transaction_date,
    auth.uid()
  ) RETURNING id INTO v_transaction_id;
  
  -- Update student pocket money balance
  UPDATE students
  SET pocket_money_paise = pocket_money_paise + p_amount_paise
  WHERE id = p_student_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_pocket_money_transaction TO authenticated;

-- Test the validation
DO $$
DECLARE
  v_test_student_id UUID;
  v_result JSON;
BEGIN
  -- Find a graduated student (if any)
  SELECT id INTO v_test_student_id 
  FROM students 
  WHERE status = 'graduated' 
  LIMIT 1;
  
  IF v_test_student_id IS NOT NULL THEN
    BEGIN
      -- Try to process payment (should fail)
      SELECT record_fee_payment_smart(
        v_test_student_id,
        5000, -- ₹50
        'cash',
        CURRENT_DATE,
        'Test payment - should fail'
      ) INTO v_result;
      
      RAISE NOTICE '❌ ERROR: Payment was allowed for graduated student!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '✅ SUCCESS: Payment correctly rejected for graduated student';
      RAISE NOTICE '   Error message: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️  No graduated students found to test';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Student Status Validation Added';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Payment functions now validate:';
  RAISE NOTICE '   - Student must have status = ''active''';
  RAISE NOTICE '   - Student must not be deleted';
  RAISE NOTICE '';
  RAISE NOTICE '🚫 Rejected statuses:';
  RAISE NOTICE '   - graduated';
  RAISE NOTICE '   - withdrawn';
  RAISE NOTICE '   - suspended';
  RAISE NOTICE '   - left_school';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Functions updated:';
  RAISE NOTICE '   - record_fee_payment_smart()';
  RAISE NOTICE '   - process_fee_payment_with_allocation()';
  RAISE NOTICE '   - record_pocket_money_transaction()';
  RAISE NOTICE '';
END $$;
