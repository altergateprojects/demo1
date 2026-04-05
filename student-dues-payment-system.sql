-- Student Dues Payment System with Partial Payments Support
-- This allows tracking multiple payments over time until dues are fully cleared

-- Create payment logs table
CREATE TABLE IF NOT EXISTS student_due_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_due_id UUID NOT NULL REFERENCES student_dues(id) ON DELETE CASCADE,
  payment_amount_paise BIGINT NOT NULL CHECK (payment_amount_paise > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50), -- cash, online, cheque, etc.
  payment_reference VARCHAR(255), -- transaction id, cheque number, etc.
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_due_payments_due_id ON student_due_payments(student_due_id);
CREATE INDEX IF NOT EXISTS idx_student_due_payments_date ON student_due_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_student_due_payments_created_by ON student_due_payments(created_by);

-- Add amount_paid_paise column to student_dues to track total paid
ALTER TABLE student_dues 
ADD COLUMN IF NOT EXISTS amount_paid_paise BIGINT DEFAULT 0 CHECK (amount_paid_paise >= 0);

-- Add remaining_amount_paise computed column helper
-- (We'll calculate this in queries, but good to have the concept)

-- Function to add a payment and update the due
CREATE OR REPLACE FUNCTION add_student_due_payment(
  p_student_due_id UUID,
  p_payment_amount_paise BIGINT,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_payment_method VARCHAR DEFAULT NULL,
  p_payment_reference VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_due RECORD;
  v_new_paid_amount BIGINT;
  v_remaining_amount BIGINT;
  v_payment_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get the due details
  SELECT * INTO v_due FROM student_dues WHERE id = p_student_due_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student due not found';
  END IF;
  
  -- Check if already cleared
  IF v_due.is_cleared THEN
    RAISE EXCEPTION 'This due is already cleared';
  END IF;
  
  -- Calculate new paid amount
  v_new_paid_amount := COALESCE(v_due.amount_paid_paise, 0) + p_payment_amount_paise;
  
  -- Check if payment exceeds remaining amount
  v_remaining_amount := v_due.amount_paise - COALESCE(v_due.amount_paid_paise, 0);
  
  IF p_payment_amount_paise > v_remaining_amount THEN
    RAISE EXCEPTION 'Payment amount (₹%) exceeds remaining amount (₹%)', 
      p_payment_amount_paise / 100.0, 
      v_remaining_amount / 100.0;
  END IF;
  
  -- Insert payment log
  INSERT INTO student_due_payments (
    student_due_id,
    payment_amount_paise,
    payment_date,
    payment_method,
    payment_reference,
    notes,
    created_by
  ) VALUES (
    p_student_due_id,
    p_payment_amount_paise,
    p_payment_date,
    p_payment_method,
    p_payment_reference,
    p_notes,
    v_user_id
  ) RETURNING id INTO v_payment_id;
  
  -- Update the due with new paid amount
  UPDATE student_dues 
  SET 
    amount_paid_paise = v_new_paid_amount,
    updated_at = NOW()
  WHERE id = p_student_due_id;
  
  -- If fully paid, mark as cleared
  IF v_new_paid_amount >= v_due.amount_paise THEN
    UPDATE student_dues 
    SET 
      is_cleared = TRUE,
      cleared_date = p_payment_date,
      cleared_by = v_user_id,
      updated_at = NOW()
    WHERE id = p_student_due_id;
  END IF;
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'total_paid', v_new_paid_amount,
    'remaining', v_due.amount_paise - v_new_paid_amount,
    'is_fully_paid', v_new_paid_amount >= v_due.amount_paise
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment history for a due
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

-- Function to get payment summary for a student
CREATE OR REPLACE FUNCTION get_student_payment_summary(p_student_id UUID)
RETURNS TABLE (
  total_dues_paise BIGINT,
  total_paid_paise BIGINT,
  total_remaining_paise BIGINT,
  number_of_dues INTEGER,
  number_of_payments INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(sd.amount_paise), 0)::BIGINT as total_dues_paise,
    COALESCE(SUM(sd.amount_paid_paise), 0)::BIGINT as total_paid_paise,
    COALESCE(SUM(sd.amount_paise - COALESCE(sd.amount_paid_paise, 0)), 0)::BIGINT as total_remaining_paise,
    COUNT(DISTINCT sd.id)::INTEGER as number_of_dues,
    COUNT(DISTINCT sdp.id)::INTEGER as number_of_payments
  FROM student_dues sd
  LEFT JOIN student_due_payments sdp ON sdp.student_due_id = sd.id
  WHERE sd.student_id = p_student_id AND sd.is_cleared = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE student_due_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_due_payments
CREATE POLICY "Users can view payment logs"
  ON student_due_payments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert payment logs"
  ON student_due_payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own payment logs"
  ON student_due_payments FOR UPDATE
  USING (created_by = auth.uid());

-- Grant permissions
GRANT ALL ON student_due_payments TO authenticated;

-- Add helpful comment
COMMENT ON TABLE student_due_payments IS 'Tracks all payments made towards student dues, supporting partial payments over time';
COMMENT ON FUNCTION add_student_due_payment IS 'Adds a payment to a student due and automatically marks as cleared when fully paid';
