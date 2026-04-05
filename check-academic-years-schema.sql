-- Check the schema of academic_years table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'academic_years' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists and what data it has
SELECT * FROM academic_years LIMIT 5;