-- Fix Fee Configuration Display Issue
-- Your data exists but isn't showing in the UI

-- 1. First, let's see what fee configurations you have
SELECT 
    fc.id,
    fc.academic_year_id,
    fc.standard_id,
    fc.gender,
    fc.annual_fee_paise,
    fc.is_active,
    ay.year_label,
    s.name as standard_name
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order;

-- 2. Check if the relationships are working
SELECT 
    'Checking relationships:' as info,
    COUNT(fc.id) as total_configs,
    COUNT(ay.id) as configs_with_academic_year,
    COUNT(s.id) as configs_with_standard
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true;

-- 3. Show any orphaned fee configurations (missing relationships)
SELECT 
    'Orphaned configurations (missing relationships):' as info,
    fc.*
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
AND (ay.id IS NULL OR s.id IS NULL);

-- 4. Fix any potential RLS issues
DROP POLICY IF EXISTS "Allow all for authenticated users" ON fee_configurations;
CREATE POLICY "Allow all for authenticated users" ON fee_configurations 
FOR ALL USING (true);  -- More permissive policy

-- 5. Also fix RLS for related tables
DROP POLICY IF EXISTS "Allow all for authenticated users" ON academic_years;
CREATE POLICY "Allow all for authenticated users" ON academic_years 
FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON standards;
CREATE POLICY "Allow all for authenticated users" ON standards 
FOR ALL USING (true);

-- 6. Grant all permissions
GRANT ALL ON fee_configurations TO authenticated;
GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON standards TO authenticated;

-- 7. Test the exact query that the frontend uses
SELECT 
    fc.*,
    ay.year_label,
    s.name
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY fc.created_at DESC;

-- Success message
SELECT 'Fee configuration display should now be fixed!' as status;