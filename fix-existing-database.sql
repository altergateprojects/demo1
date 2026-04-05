-- Fix Existing Database Issues
-- Run this if you're getting duplicate key errors

-- 1. First, let's check what data already exists
SELECT 'Current academic years:' as info;
SELECT * FROM academic_years;

SELECT 'Current standards:' as info;
SELECT * FROM standards ORDER BY sort_order;

SELECT 'Current user profiles:' as info;
SELECT COUNT(*) as user_count FROM user_profiles;

-- 2. Fix standards table - remove unique constraint on sort_order if it exists
ALTER TABLE standards DROP CONSTRAINT IF EXISTS standards_sort_order_key;

-- 3. Update existing standards with proper sort_order if needed
UPDATE standards SET sort_order = 1 WHERE name = 'Nursery' AND sort_order != 1;
UPDATE standards SET sort_order = 2 WHERE name = 'LKG' AND sort_order != 2;
UPDATE standards SET sort_order = 3 WHERE name = 'UKG' AND sort_order != 3;
UPDATE standards SET sort_order = 4 WHERE name = '1st' AND sort_order != 4;
UPDATE standards SET sort_order = 5 WHERE name = '2nd' AND sort_order != 5;
UPDATE standards SET sort_order = 6 WHERE name = '3rd' AND sort_order != 6;
UPDATE standards SET sort_order = 7 WHERE name = '4th' AND sort_order != 7;
UPDATE standards SET sort_order = 8 WHERE name = '5th' AND sort_order != 8;
UPDATE standards SET sort_order = 9 WHERE name = '6th' AND sort_order != 9;
UPDATE standards SET sort_order = 10 WHERE name = '7th' AND sort_order != 10;
UPDATE standards SET sort_order = 11 WHERE name = '8th' AND sort_order != 11;
UPDATE standards SET sort_order = 12 WHERE name = '9th' AND sort_order != 12;
UPDATE standards SET sort_order = 13 WHERE name = '10th' AND sort_order != 13;

-- 4. Insert missing standards only if they don't exist
INSERT INTO standards (name, sort_order) 
SELECT 'Nursery', 1 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = 'Nursery');

INSERT INTO standards (name, sort_order) 
SELECT 'LKG', 2 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = 'LKG');

INSERT INTO standards (name, sort_order) 
SELECT 'UKG', 3 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = 'UKG');

INSERT INTO standards (name, sort_order) 
SELECT '1st', 4 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '1st');

INSERT INTO standards (name, sort_order) 
SELECT '2nd', 5 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '2nd');

INSERT INTO standards (name, sort_order) 
SELECT '3rd', 6 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '3rd');

INSERT INTO standards (name, sort_order) 
SELECT '4th', 7 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '4th');

INSERT INTO standards (name, sort_order) 
SELECT '5th', 8 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '5th');

INSERT INTO standards (name, sort_order) 
SELECT '6th', 9 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '6th');

INSERT INTO standards (name, sort_order) 
SELECT '7th', 10 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '7th');

INSERT INTO standards (name, sort_order) 
SELECT '8th', 11 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '8th');

INSERT INTO standards (name, sort_order) 
SELECT '9th', 12 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '9th');

INSERT INTO standards (name, sort_order) 
SELECT '10th', 13 WHERE NOT EXISTS (SELECT 1 FROM standards WHERE name = '10th');

-- 5. Ensure academic year exists
INSERT INTO academic_years (year_label, start_date, end_date, is_current)
SELECT '2024-25', '2024-04-01', '2025-03-31', true
WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE year_label = '2024-25');

-- 6. Create fee_configurations table if it doesn't exist
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

-- 7. Enable RLS on fee_configurations if not already enabled
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policy for fee_configurations
DROP POLICY IF EXISTS "Allow all for authenticated users" ON fee_configurations;
CREATE POLICY "Allow all for authenticated users" ON fee_configurations 
FOR ALL USING (auth.role() = 'authenticated');

-- 9. Grant permissions
GRANT ALL ON fee_configurations TO authenticated;

-- 10. Add sample fee configurations (only if none exist)
INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise, notes)
SELECT 
    ay.id,
    s.id,
    'all',
    CASE 
        WHEN s.name IN ('Nursery', 'LKG', 'UKG') THEN 800000  -- ₹8,000
        WHEN s.name IN ('1st', '2nd', '3rd') THEN 1000000     -- ₹10,000
        WHEN s.name IN ('4th', '5th', '6th') THEN 1200000     -- ₹12,000
        WHEN s.name IN ('7th', '8th') THEN 1500000            -- ₹15,000
        WHEN s.name IN ('9th', '10th') THEN 1800000           -- ₹18,000
        ELSE 1000000
    END,
    'Standard annual fee for ' || s.name || ' - ' || ay.year_label
FROM academic_years ay
CROSS JOIN standards s
WHERE ay.year_label = '2024-25'
AND NOT EXISTS (
    SELECT 1 FROM fee_configurations fc 
    WHERE fc.academic_year_id = ay.id 
    AND fc.standard_id = s.id 
    AND fc.gender = 'all'
);

-- 11. Check what we have now
SELECT 'Updated standards:' as info;
SELECT * FROM standards ORDER BY sort_order;

SELECT 'Fee configurations created:' as info;
SELECT 
    fc.*,
    ay.year_label,
    s.name as standard_name,
    fc.annual_fee_paise / 100 as annual_fee_rupees
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
ORDER BY s.sort_order;

-- Success message
SELECT 'Database fixed successfully! Fee configurations should now be visible.' as status;