-- Check what columns exist in the standards table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'standards'
ORDER BY ordinal_position;
