-- Exit Due Payment System
-- This creates the necessary functions and tables to handle payments for exit dues

-- Function to add payment to student due (if it doesn't exist)
CREATE OR REPLACE FUNCTION add_student_due_payment(
    p_student_due_id UUID,
    p_payment_amount_paise BIGINT,
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_payment_method VARCHAR DEFAULT 'cash',
    p_payment_reference VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    due_record RECORD;
    payment_record RECORD;
    remaining_amount BIGINT;
    is_fully_paid BOOLEAN;
BEGIN
    -- Get the due record
    SELECT * INTO due_record
    FROM student_dues
    WHERE id = p_student_due_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student due not found with ID: %', p_student_due_id;
    END IF;
    
    -- Calculate remaining amount after this payment
    remaining_amount := due_record.amount_paise - COALESCE(due_record.amount_paid_paise, 0) - p_payment_amount_paise;
    is_fully_paid := remaining_amount <= 0;
    
    -- Insert payment record
    INSERT INTO student_due_payments (
        student_due_id,
        payment_amount_paise,
        payment_date,
        payment_method,
        payment_reference,
        notes,
        paid_by
    ) VALUES (
        p_student_due_id,
        p_payment_amount_paise,
        p_payment_date,
        p_payment_method,
        p_payment_reference,
        p_notes,
        auth.uid()
    ) RETURNING * INTO payment_record;
    
    -- Update the due record
    UPDATE student_dues SET
        amount_paid_paise = COALESCE(amount_paid_paise, 0) + p_payment_amount_paise,
        is_cleared = is_fully_paid,
        cleared_date = CASE WHEN is_fully_paid THEN CURRENT_DATE ELSE NULL END,
        cleared_by = CASE WHEN is_fully_paid THEN auth.uid() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_student_due_id;
    
    RETURN json_build_object(
        'success', true,
        'payment_id', payment_record.id,
        'remaining', GREATEST(0, remaining_amount),
        'is_fully_paid', is_fully_paid,
        'total_paid', COALESCE(due_record.amount_paid_paise, 0) + p_payment_amount_paise
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to add payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_student_due_payment TO authenticated;

-- Ensure student_due_payments table exists with proper structure
CREATE TABLE IF NOT EXISTS student_due_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_due_id UUID NOT NULL REFERENCES student_dues(id) ON DELETE CASCADE,
    payment_amount_paise BIGINT NOT NULL CHECK (payment_amount_paise > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    payment_reference VARCHAR(255),
    notes TEXT,
    paid_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_due_payments_student_due_id ON student_due_payments(student_due_id);
CREATE INDEX IF NOT EXISTS idx_student_due_payments_payment_date ON student_due_payments(payment_date);

-- Enable RLS
ALTER TABLE student_due_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view student due payments" ON student_due_payments;
CREATE POLICY "Users can view student due payments" ON student_due_payments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert student due payments" ON student_due_payments;
CREATE POLICY "Users can insert student due payments" ON student_due_payments
    FOR INSERT WITH CHECK (true);

-- Grant permissions on table
GRANT ALL ON student_due_payments TO authenticated;

SELECT 'Exit due payment system setup completed' as status;