-- Diagnose Exit Constraint Issue
-- Run this to see what constraints are causing problems

-- 1. Show all constraints on student_exit_dues table
SELECT 
    'Current Constraints' as info,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'student_exit_dues'::regclass
ORDER BY contype, conname;

-- 2. Show column information
SELECT 
    'Column Info' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_exit_dues'
AND column_name = 'exit_reason';

-- 3. Check if there's an enum type for exit_reason
SELECT 
    'Enum Check' as info,
    typname as type_name,
    enumlabel as allowed_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname LIKE '%exit%' OR typname LIKE '%reason%'
ORDER BY enumsortorder;

-- 4. Show what exit reasons currently exist in the table
SELECT 
    'Existing Exit Reasons' as info,
    exit_reason,
    COUNT(*) as count
FROM student_exit_dues
GROUP BY exit_reason
ORDER BY count DESC;

-- 5. Test what happens with our exit reason
SELECT 
    'Test Exit Reason' as info,
    'Transfer to another school' as test_value,
    LENGTH('Transfer to another school') as length,
    CASE 
        WHEN LENGTH('Transfer to another school') <= 255 THEN 'Length OK'
        ELSE 'Too long'
    END as length_check;