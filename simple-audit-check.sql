-- Simple check to see if audit trail table exists
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'expense_audit_trail'
  ) THEN 'EXISTS' ELSE 'MISSING' END as audit_table_status;

-- If it exists, count records
SELECT COUNT(*) as total_audit_records 
FROM expense_audit_trail 
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'expense_audit_trail'
);