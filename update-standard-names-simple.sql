-- 🔢 UPDATE STANDARD NAMES TO SIMPLE NUMBERS
-- Removes Roman numerals and keeps only simple number format

-- Update standard names to simple format
UPDATE standards SET name = 'Nursery' WHERE name IN ('Nursery', 'nursery');
UPDATE standards SET name = 'LKG' WHERE name IN ('LKG', 'lkg');
UPDATE standards SET name = 'UKG' WHERE name IN ('UKG', 'ukg');
UPDATE standards SET name = '1st' WHERE name IN ('1st', 'I', '1');
UPDATE standards SET name = '2nd' WHERE name IN ('2nd', 'II', '2');
UPDATE standards SET name = '3rd' WHERE name IN ('3rd', 'III', '3');
UPDATE standards SET name = '4th' WHERE name IN ('4th', 'IV', '4');
UPDATE standards SET name = '5th' WHERE name IN ('5th', 'V', '5');
UPDATE standards SET name = '6th' WHERE name IN ('6th', 'VI', '6');
UPDATE standards SET name = '7th' WHERE name IN ('7th', 'VII', '7');
UPDATE standards SET name = '8th' WHERE name IN ('8th', 'VIII', '8');
UPDATE standards SET name = '9th' WHERE name IN ('9th', 'IX', '9');
UPDATE standards SET name = '10th' WHERE name IN ('10th', 'X', '10');
UPDATE standards SET name = '11th' WHERE name IN ('11th', 'XI', '11');
UPDATE standards SET name = '12th' WHERE name IN ('12th', 'XII', '12');

-- Show updated standards
SELECT 
    '=== UPDATED STANDARDS ===' as info;

SELECT 
    name as "Standard Name",
    sort_order as "Sort Order"
FROM standards
ORDER BY sort_order;

SELECT '✅ Standard names updated to simple format!' as status;