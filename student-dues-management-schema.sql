-- Student Dues Management System
-- Handles previous year dues, promotions, and students who left with pending payments

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

-- Enable RLS
ALTER TABLE student_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exit_dues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view student dues" ON student_dues FOR SELECT USING (true);
CREATE POLICY "Finance users can manage student dues" ON student_dues FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'principal'))
);

CREATE POLICY "Users can view student promotions" ON student_promotions FOR SELECT USING (true);
CREATE POLICY "Admin users can manage student promotions" ON student_promotions FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'principal'))
);

CREATE POLICY "Users can view student exit dues" ON student_exit_dues FOR SELECT USING (true);
CREATE POLICY "Finance users can manage student exit dues" ON student_exit_dues FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'principal'))
);

-- Create indexes
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON student_dues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_exit_dues TO authenticated;

GRANT EXECUTE ON FUNCTION get_student_total_dues(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION promote_student_with_dues(UUID, UUID, UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_student_exit_with_dues(UUID, VARCHAR, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_student_dues(UUID[], TEXT) TO authenticated;

-- Success message
SELECT 'Student dues management system created successfully' AS status;