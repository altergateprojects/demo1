-- 🔍 CHECK AND FIX STANDARD NAMES
-- Shows current standards and removes duplicates/Roman numerals

-- Step 1: See what you currently have
SELECT '=== CURRENT STANDARDS ===' as info;

SELECT 
    id,
    name,
    sort_order
FROM standards
ORDER BY sort_order;

-- Step 2: Delete Roman numeral duplicates (keep the simple number versions)
DELETE FROM standards WHERE name = 'I' AND EXISTS (SELECT 1 FROM standards WHERE name = '1st');
DELETE FROM standards WHERE name = 'II' AND EXISTS (SELECT 1 FROM standards WHERE name = '2nd');
DELETE FROM standards WHERE name = 'III' AND EXISTS (SELECT 1 FROM standards WHERE name = '3rd');
DELETE FROM standards WHERE name = 'IV' AND EXISTS (SELECT 1 FROM standards WHERE name = '4th');
DELETE FROM standards WHERE name = 'V' AND EXISTS (SELECT 1 FROM standards WHERE name = '5th');
DELETE FROM standards WHERE name = 'VI' AND EXISTS (SELECT 1 FROM standards WHERE name = '6th');
DELETE FROM standards WHERE name = 'VII' AND EXISTS (SELECT 1 FROM standards WHERE name = '7th');
DELETE FROM standards WHERE name = 'VIII' AND EXISTS (SELECT 1 FROM standards WHERE name = '8th');
DELETE FROM standards WHERE name = 'IX' AND EXISTS (SELECT 1 FROM standards WHERE name = '9th');
DELETE FROM standards WHERE name = 'X' AND EXISTS (SELECT 1 FROM standards WHERE name = '10th');
DELETE FROM standards WHERE name = 'XI' AND EXISTS (SELECT 1 FROM standards WHERE name = '11th');
DELETE FROM standards WHERE name = 'XII' AND EXISTS (SELECT 1 FROM standards WHERE name = '12th');

-- Step 3: Update any remaining Roman numerals to simple format
UPDATE standards SET name = '1st' WHERE name IN ('I', '1') AND name != '1st';
UPDATE standards SET name = '2nd' WHERE name IN ('II', '2') AND name != '2nd';
UPDATE standards SET name = '3rd' WHERE name IN ('III', '3') AND name != '3rd';
UPDATE standards SET name = '4th' WHERE name IN ('IV', '4') AND name != '4th';
UPDATE standards SET name = '5th' WHERE name IN ('V', '5') AND name != '5th';
UPDATE standards SET name = '6th' WHERE name IN ('VI', '6') AND name != '6th';
UPDATE standards SET name = '7th' WHERE name IN ('VII', '7') AND name != '7th';
UPDATE standards SET name = '8th' WHERE name IN ('VIII', '8') AND name != '8th';
UPDATE standards SET name = '9th' WHERE name IN ('IX', '9') AND name != '9th';
UPDATE standards SET name = '10th' WHERE name IN ('X', '10') AND name != '10th';
UPDATE standards SET name = '11th' WHERE name IN ('XI', '11') AND name != '11th';
UPDATE standards SET name = '12th' WHERE name IN ('XII', '12') AND name != '12th';

-- Step 4: Show final result
SELECT '=== CLEANED STANDARDS ===' as info;

SELECT 
    name as "Standard Name",
    sort_order as "Sort Order"
FROM standards
ORDER BY sort_order;

SELECT 
    '✅ Standards cleaned!' as status,
    'Total standards: ' || COUNT(*) as count
FROM standards;