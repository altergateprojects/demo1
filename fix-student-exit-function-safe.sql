-- Safe Fix for Student Exit with Dues Function
-- This version handles existing components gracefully

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view student exit dues" ON student_exit_dues;
DROP POLICY IF EXISTS "Users can insert student exit dues" ON student_exit_dues;

-- Ensure the student_exit_dues table exists with all required columns
CREATE TABLE IF NOT EXISTS public.student_exit_dues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    exit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_reason VARCHAR(255) NOT NULL,
    pending_fee_paise BIGINT DEFAULT 0,
    pending_pocket_money_paise BIGINT DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Store student data snapshot for reference
    student_name VARCHAR(255),
    student_roll VARCHAR(50),
    student_standard VARCHAR(100),
    student_phone VARCHAR(20),
    student_guardian VARCHAR(255)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add student_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_exit_dues' AND column_name = 'student_name') THEN
        ALTER TABLE student_exit_dues ADD COLUMN student_name VARCHAR(255);
    END IF;
    
    -- Add student_roll if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_exit_dues' AND column_name = 'student_roll') THEN
        ALTER TABLE student_exit_dues ADD COLUMN student_roll VARCHAR(50);
    END IF;
    
    -- Add student_standard if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_exit_dues' AND column_name = 'student_standard') THEN
        ALTER TABLE student_exit_dues ADD COLUMN student_standard VARCHAR(100);
    END IF;
    
    -- Add student_phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_exit_dues' AND column_name = 'student_phone') THEN
        ALTER TABLE student_exit_dues ADD COLUMN student_phone VARCHAR(20);
    END IF;
    
    -- Add student_guardian if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_exit_dues' AND column_name = 'student_guardian') THEN
        ALTER TABLE student_exit_dues ADD COLUMN student_guardian VARCHAR(255);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_exit_dues_student_id_fkey' 
        AND table_name = 'student_exit_dues'
    ) THEN
        ALTER TABLE student_exit_dues 
        ADD CONSTRAINT student_exit_dues_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE student_exit_dues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (fresh ones)
CREATE POLICY "Users can view student exit dues" ON student_exit_dues
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'finance', 'staff')
        )
    );

CREATE POLICY "Users can insert student exit dues" ON student_exit_dues
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'finance')
        )
    );

-- Create or replace the function (this always works)
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
    previous_years_pending BIGINT;
    exit_record RECORD;
BEGIN
    -- Get current student data with related info
    SELECT 
        s.*,
        st.name as standard_name,
        ay.year_label
    INTO current_student
    FROM students s
    LEFT JOIN standards st ON s.standard_id = st.id
    LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
    WHERE s.id = p_student_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found with ID: %', p_student_id;
    END IF;
    
    -- Calculate pending amounts
    pending_fee := GREATEST(0, COALESCE(current_student.annual_fee_paise, 0) - COALESCE(current_student.fee_paid_paise, 0));
    pending_pocket := LEAST(0, COALESCE(current_student.pocket_money_paise, 0)); -- Only negative amounts
    
    -- Get previous years pending from snapshots
    SELECT COALESCE(SUM(dues_carried_forward_paise), 0) INTO previous_years_pending
    FROM student_year_snapshots 
    WHERE student_id = p_student_id;
    
    -- Create exit dues record with student snapshot
    INSERT INTO student_exit_dues (
        student_id,
        exit_date,
        exit_reason,
        pending_fee_paise,
        pending_pocket_money_paise,
        notes,
        created_by,
        student_name,
        student_roll,
        student_standard,
        student_phone,
        student_guardian
    ) VALUES (
        p_student_id,
        p_exit_date,
        p_exit_reason,
        pending_fee + previous_years_pending, -- Total pending fees
        pending_pocket,
        p_notes,
        auth.uid(),
        current_student.full_name,
        current_student.roll_number,
        current_student.standard_name,
        current_student.phone,
        current_student.guardian_name
    ) RETURNING * INTO exit_record;
    
    -- Mark student as withdrawn (don't delete, just change status)
    UPDATE students SET
        status = 'withdrawn',
        updated_at = NOW()
    WHERE id = p_student_id;
    
    -- Log the action in audit trail (only if audit_logs table exists)
    BEGIN
        INSERT INTO audit_logs (
            action_type,
            entity_type,
            entity_id,
            entity_label,
            description,
            created_by
        ) VALUES (
            'MOVE_TO_DUES',
            'student_exit',
            p_student_id::TEXT,
            current_student.full_name || ' (' || current_student.roll_number || ')',
            'Student moved to dues section. Reason: ' || p_exit_reason,
            auth.uid()
        );
    EXCEPTION WHEN OTHERS THEN
        -- If audit logging fails, continue anyway
        NULL;
    END;
    
    RETURN json_build_object(
        'success', true,
        'exit_id', exit_record.id,
        'student_name', current_student.full_name,
        'student_roll', current_student.roll_number,
        'total_pending_fee', pending_fee + previous_years_pending,
        'pending_pocket_money', pending_pocket,
        'exit_reason', p_exit_reason,
        'exit_date', p_exit_date,
        'message', 'Student successfully moved to dues section'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to record student exit: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_student_exit_with_dues TO authenticated;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_student_exit_dues_student_id ON student_exit_dues(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exit_dues_exit_date ON student_exit_dues(exit_date);
CREATE INDEX IF NOT EXISTS idx_student_exit_dues_created_by ON student_exit_dues(created_by);

-- Test the function exists
SELECT 'Function created successfully' as status, 
       routine_name, 
       routine_type 
FROM information_schema.routines 
WHERE routine_name = 'record_student_exit_with_dues'
AND routine_schema = 'public';