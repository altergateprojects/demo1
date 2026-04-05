-- Simple check for audit trail tables
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'expense_audit_trail'
  ) THEN 'expense_audit_trail EXISTS' 
  ELSE 'expense_audit_trail MISSING' END as audit_table_status;

-- If audit table exists, check if it has any records
DO $$
DECLARE
  record_count INTEGER;
  audit_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_audit_trail') THEN
    SELECT COUNT(*) INTO record_count FROM expense_audit_trail;
    RAISE NOTICE 'Audit trail records found: %', record_count;
    
    -- Show sample audit records if any exist
    IF record_count > 0 THEN
      RAISE NOTICE 'Sample audit records:';
      FOR audit_record IN (SELECT expense_id, action_type, performed_at FROM expense_audit_trail ORDER BY performed_at DESC LIMIT 3) LOOP
        RAISE NOTICE 'Expense: %, Action: %, Time: %', audit_record.expense_id, audit_record.action_type, audit_record.performed_at;
      END LOOP;
    END IF;
  ELSE
    RAISE NOTICE 'expense_audit_trail table does not exist - need to create it';
  END IF;
END $$;

-- Check for triggers on expenses table
SELECT 
  COUNT(*) as trigger_count,
  STRING_AGG(trigger_name, ', ') as trigger_names
FROM information_schema.triggers
WHERE event_object_table = 'expenses' AND trigger_schema = 'public';