-- =====================================================
-- STUDENT DUES TABLE SETUP
-- Simple setup for Student Dues Management page
-- =====================================================

-- Drop existing table if needed (be careful in production!)
-- DROP TABLE IF EXISTS student_dues CASCADE;

-- Create student_dues table
CREATE TABLE IF NOT EXISTS student_dues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Student reference (can be NULL for students who left/passed out)
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    
    -- Academic year when the due originated
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- Due type: 'fee' or 'pocket_money'
    due_type TEXT NOT NULL CHECK (due_type IN ('fee', 'pocket_money')),
    
    -- Amount in paise (to avoid decimal issues)
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    
    -- Description/notes (stores student info for non-enrolled students)
    description TEXT,
    
    -- When the due was recorded
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Clearance tracking
    is_cleared BOOLEAN NOT NULL DEFAULT FALSE,
    cleared_date DATE,
    cleared_by UUID REFERENCES user_profiles(id),
    payment_reference TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_dues_student_id ON student_dues(student_id);
CREATE INDEX IF NOT EXISTS idx_student_dues_academic_year_id ON student_dues(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_dues_is_cleared ON student_dues(is_cleared);
CREATE INDEX IF NOT EXISTS idx_student_dues_due_type ON student_dues(due_type);
CREATE INDEX IF NOT EXISTS idx_student_dues_created_at ON student_dues(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_student_dues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_student_dues_updated_at ON student_dues;
CREATE TRIGGER trigger_update_student_dues_updated_at
    BEFORE UPDATE ON student_dues
    FOR EACH ROW
    EXECUTE FUNCTION update_student_dues_updated_at();

-- Enable Row Level Security
ALTER TABLE student_dues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON student_dues;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON student_dues;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON student_dues;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON student_dues;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON student_dues;

-- Create simple RLS policies (allow all for authenticated users)
CREATE POLICY "Allow all operations for authenticated users"
    ON student_dues
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON student_dues TO authenticated;
GRANT ALL ON student_dues TO service_role;

-- Verify table creation
SELECT 
    'student_dues table created successfully!' as message,
    COUNT(*) as existing_records
FROM student_dues;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'student_dues'
ORDER BY ordinal_position;
