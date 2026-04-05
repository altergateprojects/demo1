-- Fix Fee Tables and Relationships
-- Run this in Supabase SQL Editor

-- Create fee_configurations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fee_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    standard_id UUID NOT NULL REFERENCES standards(id),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'all')),
    annual_fee_paise BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    UNIQUE(academic_year_id, standard_id, gender)
);

-- Create fee_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    amount_paise BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'cheque', 'upi', 'bank_transfer', 'dd', 'neft', 'rtgs')),
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    notes TEXT,
    receipt_number VARCHAR(50),
    received_by UUID NOT NULL REFERENCES user_profiles(id),
    is_reversal BOOLEAN DEFAULT false,
    reversal_reason TEXT,
    reversed_by UUID REFERENCES user_profiles(id),
    reversed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fee_configurations
DROP POLICY IF EXISTS "Users can view fee configurations" ON fee_configurations;
CREATE POLICY "Users can view fee configurations" ON fee_configurations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Finance users can manage fee configurations" ON fee_configurations;
CREATE POLICY "Finance users can manage fee configurations" ON fee_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'finance', 'principal')
        )
    );

-- Create RLS policies for fee_payments
DROP POLICY IF EXISTS "Users can view fee payments" ON fee_payments;
CREATE POLICY "Users can view fee payments" ON fee_payments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Finance users can manage fee payments" ON fee_payments;
CREATE POLICY "Finance users can manage fee payments" ON fee_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'finance', 'principal')
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_configurations_academic_year ON fee_configurations(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_configurations_standard ON fee_configurations(standard_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_academic_year ON fee_payments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON fee_payments(payment_date);

-- Create function to get fee statistics
CREATE OR REPLACE FUNCTION get_fee_statistics(academic_year_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_expected_paise', COALESCE(SUM(fc.annual_fee_paise), 0),
        'total_collected_paise', COALESCE(SUM(fp.amount_paise), 0),
        'total_pending_paise', COALESCE(SUM(fc.annual_fee_paise), 0) - COALESCE(SUM(fp.amount_paise), 0),
        'students_paid', COUNT(DISTINCT fp.student_id),
        'collection_percentage', 
            CASE 
                WHEN SUM(fc.annual_fee_paise) > 0 
                THEN ROUND((SUM(fp.amount_paise)::DECIMAL / SUM(fc.annual_fee_paise)::DECIMAL) * 100, 2)
                ELSE 0 
            END,
        'payment_methods', (
            SELECT json_agg(
                json_build_object(
                    'method', payment_method,
                    'amount_paise', SUM(amount_paise),
                    'count', COUNT(*)
                )
            )
            FROM fee_payments 
            WHERE academic_year_id = $1 
            AND is_reversal = false
            GROUP BY payment_method
        )
    ) INTO result
    FROM students s
    JOIN standards st ON s.standard_id = st.id
    LEFT JOIN fee_configurations fc ON fc.standard_id = st.id 
        AND fc.academic_year_id = $1 
        AND fc.gender IN ('all', s.gender)
        AND fc.is_active = true
    LEFT JOIN fee_payments fp ON fp.student_id = s.id 
        AND fp.academic_year_id = $1 
        AND fp.is_reversal = false
    WHERE s.academic_year_id = $1;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_payments TO authenticated;
GRANT EXECUTE ON FUNCTION get_fee_statistics(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fee tables and functions created successfully';
END $$;