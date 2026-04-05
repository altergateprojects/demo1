-- 🔍 CHECK AND ADD FEE CONFIGURATIONS
-- This script checks what you have and adds sample configs if needed

-- Step 1: Check what fee configurations exist
SELECT '=== CURRENT FEE CONFIGURATIONS ===' as info;

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
ORDER BY fc.created_at DESC;

-- Step 2: Check if the query the frontend uses works
SELECT '=== FRONTEND QUERY TEST ===' as info;

SELECT 
    fc.*,
    json_build_object('year_label', ay.year_label) as academic_year,
    json_build_object('name', s.name) as standard
FROM fee_configurations fc
LEFT JOIN academic_years ay ON fc.academic_year_id = ay.id
LEFT JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY fc.created_at DESC;

-- Step 3: Check if we have academic years and standards
SELECT '=== CHECKING PREREQUISITES ===' as info;

SELECT 
    'Academic Years: ' || COUNT(*) as check_1
FROM academic_years;

SELECT 
    'Standards: ' || COUNT(*) as check_2
FROM standards;

-- Step 4: Add sample fee configurations if none exist
DO $$
DECLARE
    ay_id UUID;
    std_rec RECORD;
    config_count INTEGER;
BEGIN
    -- Check if we have any fee configurations
    SELECT COUNT(*) INTO config_count FROM fee_configurations WHERE is_active = true;
    
    IF config_count = 0 THEN
        RAISE NOTICE 'No fee configurations found. Adding samples...';
        
        -- Get current academic year
        SELECT id INTO ay_id FROM academic_years WHERE is_current = true LIMIT 1;
        
        IF ay_id IS NULL THEN
            SELECT id INTO ay_id FROM academic_years ORDER BY created_at DESC LIMIT 1;
        END IF;
        
        IF ay_id IS NOT NULL THEN
            -- Add fee configurations for each standard
            FOR std_rec IN (SELECT id, name FROM standards ORDER BY sort_order LIMIT 10)
            LOOP
                INSERT INTO fee_configurations (
                    academic_year_id, 
                    standard_id, 
                    gender, 
                    annual_fee_paise,
                    notes,
                    is_active
                )
                VALUES (
                    ay_id,
                    std_rec.id,
                    'all',
                    1000000,  -- ₹10,000
                    'Sample fee configuration for ' || std_rec.name,
                    true
                )
                ON CONFLICT (academic_year_id, standard_id, gender) DO NOTHING;
            END LOOP;
            
            RAISE NOTICE 'Sample fee configurations added!';
        ELSE
            RAISE NOTICE 'No academic year found. Please add an academic year first.';
        END IF;
    ELSE
        RAISE NOTICE 'Fee configurations already exist: %', config_count;
    END IF;
END $$;

-- Step 5: Show the results
SELECT '=== FINAL RESULTS ===' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY s.sort_order) as "#",
    ay.year_label as "Academic Year",
    s.name as "Standard",
    fc.gender as "Gender",
    '₹' || (fc.annual_fee_paise / 100)::text as "Annual Fee",
    fc.is_active as "Active"
FROM fee_configurations fc
JOIN academic_years ay ON fc.academic_year_id = ay.id
JOIN standards s ON fc.standard_id = s.id
WHERE fc.is_active = true
ORDER BY s.sort_order, fc.gender;

SELECT 
    '✅ CHECK COMPLETE!' as status,
    'Total configurations: ' || COUNT(*) as count
FROM fee_configurations 
WHERE is_active = true;