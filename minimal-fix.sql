-- Minimal Fix for Database Issues
-- Run this if you're getting errors with the main setup

-- 1. Create fee_configurations table (the main missing piece)
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

-- 2. Enable RLS
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;

-- 3. Create simple RLS policy
DROP POLICY IF EXISTS "Allow all for authenticated users" ON fee_configurations;
CREATE POLICY "Allow all for authenticated users" ON fee_configurations 
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON fee_configurations TO authenticated;

-- 5. Add one sample fee configuration using existing data
INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise, notes)
SELECT 
    ay.id,
    s.id,
    'all',
    1000000, -- ₹10,000 in paise
    'Sample fee configuration for ' || s.name
FROM academic_years ay
CROSS JOIN standards s
WHERE ay.is_current = true
AND s.sort_order <= 5  -- Only first 5 standards to avoid too many
AND NOT EXISTS (
    SELECT 1 FROM fee_configurations fc 
    WHERE fc.academic_year_id = ay.id 
    AND fc.standard_id = s.id 
    AND fc.gender = 'all'
)
LIMIT 5;

-- 6. Check if we have any fee configurations now
SELECT 
    'Fee configurations created:' as status,
    COUNT(*) as count
FROM fee_configurations;

-- 7. Show what was created
SELECT 
    fc.id,
    ay.year_label,
    s.name as standard_name,
    fc.annual_fee_paise / 100 as annual_fee_rupees,
    fc.gender
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
ORDER BY s.sort_order
LIMIT 10;