-- Show Existing Fee Configurations and Clean Up Issues

-- 1. Show all your current fee configurations in a readable format
SELECT 
    '=== YOUR CURRENT FEE CONFIGURATIONS ===' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY s.sort_order) as "#",
    ay.year_label as "Academic Year",
    s.name as "Standard", 
    fc.gender as "Gender",
    '₹' || (fc.annual_fee_paise / 100)::text as "Annual Fee",
    fc.is_active as "Active",
    fc.created_at::date as "Created Date"
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order, fc.gender;

-- 2. Show which combinations are already taken (to avoid duplicates)
SELECT 
    '=== EXISTING COMBINATIONS (Avoid These When Adding New) ===' as info;

SELECT 
    ay.year_label || ' + ' || s.name || ' + ' || fc.gender as "Existing Combination"
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order;

-- 3. Show available combinations you CAN add
SELECT 
    '=== AVAILABLE COMBINATIONS (You Can Add These) ===' as info;

SELECT 
    ay.year_label as "Academic Year",
    s.name as "Standard",
    g.gender as "Gender",
    'Available to add' as "Status"
FROM academic_years ay
CROSS JOIN standards s
CROSS JOIN (
    SELECT 'all' as gender
    UNION SELECT 'male' 
    UNION SELECT 'female' 
    UNION SELECT 'other'
) g
WHERE NOT EXISTS (
    SELECT 1 FROM fee_configurations fc
    WHERE fc.academic_year_id = ay.id
    AND fc.standard_id = s.id
    AND fc.gender = g.gender
    AND fc.is_active = true
)
AND s.sort_order <= 10  -- Limit to first 10 standards
ORDER BY s.sort_order, g.gender
LIMIT 20;

-- 4. Fix any potential issues with the data
UPDATE fee_configurations 
SET is_active = true 
WHERE is_active IS NULL;

-- 5. Test the frontend query
SELECT 
    '=== TESTING FRONTEND QUERY ===' as info;

SELECT 
    fc.*,
    json_build_object('year_label', ay.year_label) as academic_year,
    json_build_object('name', s.name) as standard
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY fc.created_at DESC;

SELECT 'Check complete! Your fee configurations should now be visible in the UI.' as status;