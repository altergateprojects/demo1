-- 🔧 FIX STANDARDS CONSTRAINT ISSUE
-- This script safely fixes the duplicate sort_order problem

-- Step 1: See what we're dealing with
SELECT 'Current standards data:' as info;
SELECT id, name, sort_order FROM standards ORDER BY sort_order;

-- Step 2: Drop the problematic constraint temporarily
ALTER TABLE standards DROP CONSTRAINT IF EXISTS standards_sort_order_key;

-- Step 3: Fix duplicate sort_order values using a CTE
WITH numbered_standards AS (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY name) as temp_order
    FROM standards
)
UPDATE standards 
SET sort_order = -(ns.temp_order)
FROM numbered_standards ns
WHERE standards.id = ns.id;

-- Step 4: Set proper positive values based on standard names
UPDATE standards SET sort_order = CASE name
    WHEN 'Nursery' THEN 1
    WHEN 'LKG' THEN 2
    WHEN 'UKG' THEN 3
    WHEN '1st' THEN 4
    WHEN '2nd' THEN 5
    WHEN '3rd' THEN 6
    WHEN '4th' THEN 7
    WHEN '5th' THEN 8
    WHEN '6th' THEN 9
    WHEN '7th' THEN 10
    WHEN '8th' THEN 11
    WHEN '9th' THEN 12
    WHEN '10th' THEN 13
    ELSE ABS(sort_order) + 100  -- For any other standards
END;

-- Step 4: Set proper positive values based on standard names
UPDATE standards SET sort_order = CASE name
    WHEN 'Nursery' THEN 1
    WHEN 'LKG' THEN 2
    WHEN 'UKG' THEN 3
    WHEN '1st' THEN 4
    WHEN '2nd' THEN 5
    WHEN '3rd' THEN 6
    WHEN '4th' THEN 7
    WHEN '5th' THEN 8
    WHEN '6th' THEN 9
    WHEN '7th' THEN 10
    WHEN '8th' THEN 11
    WHEN '9th' THEN 12
    WHEN '10th' THEN 13
    ELSE ABS(sort_order) + 100  -- For any other standards
END;

-- Step 5: Add missing standards if they don't exist
INSERT INTO standards (name, sort_order) VALUES
('Nursery', 1), ('LKG', 2), ('UKG', 3), ('1st', 4), ('2nd', 5),
('3rd', 6), ('4th', 7), ('5th', 8), ('6th', 9), ('7th', 10),
('8th', 11), ('9th', 12), ('10th', 13)
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- Step 6: Recreate the constraint
ALTER TABLE standards ADD CONSTRAINT standards_sort_order_key UNIQUE (sort_order);

-- Step 7: Verify the fix
SELECT 'Fixed standards data:' as info;
SELECT id, name, sort_order FROM standards ORDER BY sort_order;

SELECT '✅ Standards constraint fixed!' as status;