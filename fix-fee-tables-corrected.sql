-- Fix Fee Tables and Relationships (CORRECTED VERSION)
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

-- Create function to update student fees based on fee configurations
CREATE OR REPLACE FUNCTION update_student_fees_from_config(
    p_academic_year_id UUID,
    p_standard_id UUID DEFAULT NULL,
    p_gender VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    student_record RECORD;
    fee_config RECORD;
BEGIN
    -- Loop through students that match the criteria
    FOR student_record IN 
        SELECT s.id, s.standard_id, s.gender, s.annual_fee_paise as current_fee
        FROM students s
        WHERE s.academic_year_id = p_academic_year_id
        AND s.is_deleted = false
        AND (p_standard_id IS NULL OR s.standard_id = p_standard_id)
        AND (p_gender IS NULL OR s.gender = p_gender)
    LOOP
        -- Find the appropriate fee configuration for this student
        SELECT fc.annual_fee_paise INTO fee_config
        FROM fee_configurations fc
        WHERE fc.academic_year_id = p_academic_year_id
        AND fc.standard_id = student_record.standard_id
        AND fc.gender IN ('all', student_record.gender)
        AND fc.is_active = true
        ORDER BY 
            CASE WHEN fc.gender = student_record.gender THEN 1 ELSE 2 END,
            fc.created_at DESC
        LIMIT 1;
        
        -- Update student's annual fee if a configuration was found and it's different
        IF FOUND AND fee_config.annual_fee_paise != student_record.current_fee THEN
            UPDATE students 
            SET annual_fee_paise = fee_config.annual_fee_paise,
                updated_at = NOW()
            WHERE id = student_record.id;
            
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to automatically update student fees when fee configurations change
CREATE OR REPLACE FUNCTION trigger_update_student_fees()
RETURNS TRIGGER AS $$
BEGIN
    -- Update students when fee configuration is inserted or updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_student_fees_from_config(
            NEW.academic_year_id,
            NEW.standard_id,
            CASE WHEN NEW.gender = 'all' THEN NULL ELSE NEW.gender END
        );
        RETURN NEW;
    END IF;
    
    -- Update students when fee configuration is deleted (set to inactive)
    IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
        -- When a config is deactivated, we need to find alternative configs or set to 0
        PERFORM update_student_fees_from_config(
            NEW.academic_year_id,
            NEW.standard_id,
            CASE WHEN NEW.gender = 'all' THEN NULL ELSE NEW.gender END
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on fee_configurations table
DROP TRIGGER IF EXISTS fee_config_update_student_fees ON fee_configurations;
CREATE TRIGGER fee_config_update_student_fees
    AFTER INSERT OR UPDATE ON fee_configurations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_student_fees();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_payments TO authenticated;
GRANT EXECUTE ON FUNCTION get_fee_statistics(UUID) TO authenticated;

-- Success message
SELECT 'Fee tables and functions created successfully' AS status;