-- Complete Student Dues Management System Setup
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- PART 1: Enhanced Fee Tables and Functions
-- =====================================================

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

-- =====================================================
-- PART 2: Student Dues Management Tables
-- =====================================================

-- Create table for tracking student dues across academic years
CREATE TABLE IF NOT EXISTS public.student_dues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    due_type VARCHAR(20) NOT NULL CHECK (due_type IN ('fee', 'pocket_money')),
    amount_paise BIGINT NOT NULL,
    description TEXT,
    is_cleared BOOLEAN DEFAULT false,
    cleared_at TIMESTAMP WITH TIME ZONE,
    cleared_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    UNIQUE(student_id, academic_year_id, due_type)
);

-- Create table for student promotions/transfers
CREATE TABLE IF NOT EXISTS public.student_promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id),
    from_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    to_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    from_standard_id UUID NOT NULL REFERENCES standards(id),
    to_standard_id UUID REFERENCES standards(id),
    promotion_type VARCHAR(20) NOT NULL CHECK (promotion_type IN ('promoted', 'repeated', 'transferred', 'left')),
    promotion_date DATE NOT NULL,
    notes TEXT,
    pending_fee_paise BIGINT DEFAULT 0,
    pending_pocket_money_paise BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Create table for students who left with dues
CREATE TABLE IF NOT EXISTS public.student_exit_dues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id),
    exit_date DATE NOT NULL,
    exit_reason VARCHAR(50) NOT NULL CHECK (exit_reason IN ('transfer', 'dropout', 'completion', 'other')),
    pending_fee_paise BIGINT DEFAULT 0,
    pending_pocket_money_paise BIGINT DEFAULT 0,
    total_due_paise BIGINT GENERATED ALWAYS AS (pending_fee_paise + ABS(LEAST(pending_pocket_money_paise, 0))) STORED,
    is_cleared BOOLEAN DEFAULT false,
    cleared_at TIMESTAMP WITH TIME ZONE,
    cleared_by UUID REFERENCES user_profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- =====================================================
-- PART 3: Enable RLS and Create Policies
-- =====================================================

-- Enable RLS
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exit_dues ENABLE ROW LEVEL SECURITY;

-- Fee configuration policies
DROP POLICY IF EXISTS "Users can view fee configurations" ON fee_configurations;
CREATE POLICY "Users can view fee configurations" ON fee_configurations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Finance users can manage fee configurations" ON fee_configurations;
CREATE POLICY "Finance users can manage fee configurations" ON fee_configurations FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'principal'))
);

-- Fee payment policies
DROP POLICY IF EXISTS "Users can view fee payments" ON fee_payments;
CREATE POLICY "Users can view fee payments" ON fee_payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Finance users can manage fee payments" ON fee_payments;
CREATE POLICY "Finance users can manage fee payments" ON fee_payments FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'principal'))
);

-- Student dues policies
DROP POLICY IF EXISTS "Users can view student dues" ON student_dues;
CREATE POLICY "Users can view student dues" ON student_dues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Finance users can manage student dues" ON student_dues;
CREATE POLICY "Finance users can manage student dues" ON student_dues FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'principal'))
);

-- Student promotion policies
DROP POLICY IF EXISTS "Users can view student promotions" ON student_promotions;
CREATE POLICY "Users can view student promotions" ON student_promotions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin users can manage student promotions" ON student_promotions;
CREATE POLICY "Admin users can manage student promotions" ON student_promotions FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'principal'))
);

-- Student exit dues policies
DROP POLICY IF EXISTS "Users can view student exit dues" ON student_exit_dues;
CREATE POLICY "Users can view student exit dues" ON student_exit_dues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Finance users can manage student exit dues" ON student_exit_dues;
CREATE POLICY "Finance users can manage student exit dues" ON student_exit_dues FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'principal'))
);

-- =====================================================
-- PART 4: Create Indexes
-- =====================================================

-- Fee table indexes
CREATE INDEX IF NOT EXISTS idx_fee_configurations_academic_year ON fee_configurations(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_configurations_standard ON fee_configurations(standard_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_academic_year ON fee_payments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON fee_payments(payment_date);

-- Student dues indexes
CREATE INDEX IF NOT EXISTS idx_student_dues_student ON student_dues(student_id);
CREATE INDEX IF NOT EXISTS idx_student_dues_academic_year ON student_dues(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_dues_type ON student_dues(due_type);
CREATE INDEX IF NOT EXISTS idx_student_dues_cleared ON student_dues(is_cleared);

CREATE INDEX IF NOT EXISTS idx_student_promotions_student ON student_promotions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_promotions_from_year ON student_promotions(from_academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_promotions_to_year ON student_promotions(to_academic_year_id);

CREATE INDEX IF NOT EXISTS idx_student_exit_dues_student ON student_exit_dues(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exit_dues_cleared ON student_exit_dues(is_cleared);
CREATE INDEX IF NOT EXISTS idx_student_exit_dues_exit_date ON student_exit_dues(exit_date);

-- =====================================================
-- PART 5: Create Functions
-- =====================================================

-- Function to get fee statistics
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

-- Function to update student fees based on fee configurations
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

-- Function to calculate student's total pending dues across all years
CREATE OR REPLACE FUNCTION get_student_total_dues(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_year_fee BIGINT := 0;
    current_year_pocket BIGINT := 0;
    previous_dues BIGINT := 0;
    exit_dues BIGINT := 0;
BEGIN
    -- Get current year dues from student record
    SELECT 
        GREATEST(0, annual_fee_paise - fee_paid_paise),
        pocket_money_paise
    INTO current_year_fee, current_year_pocket
    FROM students 
    WHERE id = p_student_id AND is_deleted = false;
    
    -- Get previous year dues
    SELECT COALESCE(SUM(amount_paise), 0)
    INTO previous_dues
    FROM student_dues 
    WHERE student_id = p_student_id AND is_cleared = false;
    
    -- Get exit dues if student has left
    SELECT COALESCE(total_due_paise, 0)
    INTO exit_dues
    FROM student_exit_dues 
    WHERE student_id = p_student_id AND is_cleared = false;
    
    -- Build result
    SELECT json_build_object(
        'student_id', p_student_id,
        'current_year_fee_due', COALESCE(current_year_fee, 0),
        'current_year_pocket_money', COALESCE(current_year_pocket, 0),
        'previous_year_dues', COALESCE(previous_dues, 0),
        'exit_dues', COALESCE(exit_dues, 0),
        'total_fee_due', COALESCE(current_year_fee, 0) + COALESCE(previous_dues, 0) + COALESCE(exit_dues, 0),
        'pocket_money_balance', COALESCE(current_year_pocket, 0),
        'has_negative_pocket_money', COALESCE(current_year_pocket, 0) < 0,
        'total_amount_due', COALESCE(current_year_fee, 0) + COALESCE(previous_dues, 0) + COALESCE(exit_dues, 0) + ABS(LEAST(COALESCE(current_year_pocket, 0), 0))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote student to next year and record dues
CREATE OR REPLACE FUNCTION promote_student_with_dues(
    p_student_id UUID,
    p_to_academic_year_id UUID,
    p_to_standard_id UUID,
    p_promotion_type VARCHAR DEFAULT 'promoted',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_student RECORD;
    pending_fee BIGINT;
    pending_pocket BIGINT;
    promotion_record RECORD;
BEGIN
    -- Get current student data
    SELECT * INTO current_student
    FROM students 
    WHERE id = p_student_id AND is_deleted = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found';
    END IF;
    
    -- Calculate pending amounts
    pending_fee := GREATEST(0, current_student.annual_fee_paise - current_student.fee_paid_paise);
    pending_pocket := LEAST(0, current_student.pocket_money_paise); -- Only negative amounts
    
    -- Create promotion record
    INSERT INTO student_promotions (
        student_id,
        from_academic_year_id,
        to_academic_year_id,
        from_standard_id,
        to_standard_id,
        promotion_type,
        promotion_date,
        notes,
        pending_fee_paise,
        pending_pocket_money_paise,
        created_by
    ) VALUES (
        p_student_id,
        current_student.academic_year_id,
        p_to_academic_year_id,
        current_student.standard_id,
        p_to_standard_id,
        p_promotion_type,
        CURRENT_DATE,
        p_notes,
        pending_fee,
        pending_pocket,
        auth.uid()
    ) RETURNING * INTO promotion_record;
    
    -- Create dues records if there are pending amounts
    IF pending_fee > 0 THEN
        INSERT INTO student_dues (
            student_id,
            academic_year_id,
            due_type,
            amount_paise,
            description,
            created_by
        ) VALUES (
            p_student_id,
            current_student.academic_year_id,
            'fee',
            pending_fee,
            'Pending fee from ' || (SELECT year_label FROM academic_years WHERE id = current_student.academic_year_id),
            auth.uid()
        );
    END IF;
    
    IF pending_pocket < 0 THEN
        INSERT INTO student_dues (
            student_id,
            academic_year_id,
            due_type,
            amount_paise,
            description,
            created_by
        ) VALUES (
            p_student_id,
            current_student.academic_year_id,
            'pocket_money',
            ABS(pending_pocket),
            'Negative pocket money from ' || (SELECT year_label FROM academic_years WHERE id = current_student.academic_year_id),
            auth.uid()
        );
    END IF;
    
    -- Update student record for new academic year
    UPDATE students SET
        academic_year_id = p_to_academic_year_id,
        standard_id = p_to_standard_id,
        annual_fee_paise = COALESCE((
            SELECT annual_fee_paise 
            FROM fee_configurations 
            WHERE academic_year_id = p_to_academic_year_id 
            AND standard_id = p_to_standard_id 
            AND gender IN ('all', current_student.gender)
            AND is_active = true
            ORDER BY CASE WHEN gender = current_student.gender THEN 1 ELSE 2 END
            LIMIT 1
        ), 0),
        fee_paid_paise = 0,
        pocket_money_paise = GREATEST(0, current_student.pocket_money_paise), -- Reset negative to 0
        updated_at = NOW()
    WHERE id = p_student_id;
    
    RETURN json_build_object(
        'success', true,
        'promotion_id', promotion_record.id,
        'pending_fee', pending_fee,
        'pending_pocket_money', ABS(pending_pocket),
        'message', 'Student promoted successfully with dues recorded'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record student exit with dues
CREATE OR REPLACE FUNCTION record_student_exit_with_dues(
    p_student_id UUID,
    p_exit_reason VARCHAR,
    p_exit_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_student RECORD;
    pending_fee BIGINT;
    pending_pocket BIGINT;
    exit_record RECORD;
BEGIN
    -- Get current student data
    SELECT * INTO current_student
    FROM students 
    WHERE id = p_student_id AND is_deleted = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found';
    END IF;
    
    -- Calculate pending amounts
    pending_fee := GREATEST(0, current_student.annual_fee_paise - current_student.fee_paid_paise);
    pending_pocket := LEAST(0, current_student.pocket_money_paise); -- Only negative amounts
    
    -- Create exit dues record
    INSERT INTO student_exit_dues (
        student_id,
        exit_date,
        exit_reason,
        pending_fee_paise,
        pending_pocket_money_paise,
        notes,
        created_by
    ) VALUES (
        p_student_id,
        p_exit_date,
        p_exit_reason,
        pending_fee,
        pending_pocket,
        p_notes,
        auth.uid()
    ) RETURNING * INTO exit_record;
    
    -- Mark student as inactive
    UPDATE students SET
        status = 'withdrawn',
        updated_at = NOW()
    WHERE id = p_student_id;
    
    RETURN json_build_object(
        'success', true,
        'exit_id', exit_record.id,
        'pending_fee', pending_fee,
        'pending_pocket_money', ABS(pending_pocket),
        'total_due', exit_record.total_due_paise,
        'message', 'Student exit recorded with pending dues'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear student dues
CREATE OR REPLACE FUNCTION clear_student_dues(
    p_due_ids UUID[],
    p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    cleared_count INTEGER := 0;
    total_amount BIGINT := 0;
BEGIN
    -- Update dues as cleared
    UPDATE student_dues 
    SET 
        is_cleared = true,
        cleared_at = NOW(),
        cleared_by = auth.uid(),
        updated_at = NOW()
    WHERE id = ANY(p_due_ids) AND is_cleared = false;
    
    GET DIAGNOSTICS cleared_count = ROW_COUNT;
    
    -- Calculate total cleared amount
    SELECT COALESCE(SUM(amount_paise), 0) INTO total_amount
    FROM student_dues 
    WHERE id = ANY(p_due_ids);
    
    RETURN json_build_object(
        'success', true,
        'cleared_count', cleared_count,
        'total_amount_paise', total_amount,
        'message', 'Dues cleared successfully'
    );
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

-- =====================================================
-- PART 6: Grant Permissions
-- =====================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_dues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_exit_dues TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_fee_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_fees_from_config(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_total_dues(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION promote_student_with_dues(UUID, UUID, UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_student_exit_with_dues(UUID, VARCHAR, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_student_dues(UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_student_fees() TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Complete Student Dues Management System setup completed successfully!' AS status,
       'Tables created: fee_configurations, fee_payments, student_dues, student_promotions, student_exit_dues' AS tables_created,
       'Functions created: 7 functions for comprehensive dues management' AS functions_created,
       'Triggers created: Automatic fee synchronization trigger' AS triggers_created,
       'Ready to use: Navigate to /students/dues to start managing student dues' AS next_steps;