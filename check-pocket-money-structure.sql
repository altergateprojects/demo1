-- Check pocket money structure

-- 1. Check if pocket_money_transactions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'pocket_money_transactions'
) as table_exists;

-- 2. Check students table for pocket money column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'students' 
AND column_name LIKE '%pocket%';

-- 3. Check for any audit or history tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%pocket%' OR table_name LIKE '%audit%' OR table_name LIKE '%history%');

-- 4. Check current pocket money data
SELECT 
  id,
  full_name,
  pocket_money_paise,
  created_at,
  updated_at
FROM students
LIMIT 5;
