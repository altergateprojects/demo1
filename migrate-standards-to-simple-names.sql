-- 🔄 MIGRATE STANDARDS TO SIMPLE NAMES
-- Safely migrates all references from Roman numerals to simple numbers

-- Step 1: Show current situation
SELECT '=== CURRENT STANDARDS ===' as info;

SELECT 
    s.id,
    s.name,
    s.sort_order,
    COUNT(DISTINCT fc.id) as fee_configs_count,
    COUNT(DISTINCT st.id) as students_count
FROM standards s
LEFT JOIN fee_configurations fc ON s.id = fc.standard_id
LEFT JOIN students st ON s.id = st.standard_id
GROUP BY s.id, s.name, s.sort_order
ORDER BY s.sort_order;

-- Step 2: Create mapping and migrate references
DO $$
DECLARE
    roman_id UUID;
    simple_id UUID;
BEGIN
    -- Migrate I to 1st
    SELECT id INTO roman_id FROM standards WHERE name = 'I' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '1st' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated I to 1st';
    END IF;

    -- Migrate II to 2nd
    SELECT id INTO roman_id FROM standards WHERE name = 'II' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '2nd' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated II to 2nd';
    END IF;

    -- Migrate III to 3rd
    SELECT id INTO roman_id FROM standards WHERE name = 'III' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '3rd' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated III to 3rd';
    END IF;

    -- Migrate IV to 4th
    SELECT id INTO roman_id FROM standards WHERE name = 'IV' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '4th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated IV to 4th';
    END IF;

    -- Migrate V to 5th
    SELECT id INTO roman_id FROM standards WHERE name = 'V' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '5th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated V to 5th';
    END IF;

    -- Migrate VI to 6th
    SELECT id INTO roman_id FROM standards WHERE name = 'VI' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '6th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated VI to 6th';
    END IF;

    -- Migrate VII to 7th
    SELECT id INTO roman_id FROM standards WHERE name = 'VII' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '7th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated VII to 7th';
    END IF;

    -- Migrate VIII to 8th
    SELECT id INTO roman_id FROM standards WHERE name = 'VIII' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '8th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated VIII to 8th';
    END IF;

    -- Migrate IX to 9th
    SELECT id INTO roman_id FROM standards WHERE name = 'IX' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '9th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated IX to 9th';
    END IF;

    -- Migrate X to 10th
    SELECT id INTO roman_id FROM standards WHERE name = 'X' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '10th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated X to 10th';
    END IF;

    -- Migrate XI to 11th
    SELECT id INTO roman_id FROM standards WHERE name = 'XI' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '11th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated XI to 11th';
    END IF;

    -- Migrate XII to 12th
    SELECT id INTO roman_id FROM standards WHERE name = 'XII' LIMIT 1;
    SELECT id INTO simple_id FROM standards WHERE name = '12th' LIMIT 1;
    IF roman_id IS NOT NULL AND simple_id IS NOT NULL AND roman_id != simple_id THEN
        UPDATE fee_configurations SET standard_id = simple_id WHERE standard_id = roman_id;
        UPDATE students SET standard_id = simple_id WHERE standard_id = roman_id;
        DELETE FROM standards WHERE id = roman_id;
        RAISE NOTICE 'Migrated XII to 12th';
    END IF;
END $$;

-- Step 3: Show final result
SELECT '=== FINAL STANDARDS ===' as info;

SELECT 
    s.name as "Standard Name",
    s.sort_order as "Sort Order",
    COUNT(DISTINCT fc.id) as "Fee Configs",
    COUNT(DISTINCT st.id) as "Students"
FROM standards s
LEFT JOIN fee_configurations fc ON s.id = fc.standard_id
LEFT JOIN students st ON s.id = st.standard_id
GROUP BY s.id, s.name, s.sort_order
ORDER BY s.sort_order;

SELECT 
    '✅ Migration complete!' as status,
    'All Roman numerals converted to simple numbers' as message;