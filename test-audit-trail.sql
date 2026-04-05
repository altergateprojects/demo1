-- Test if audit trail tables exist and are working
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if expense_audit_trail table exists
SELECT 'expense_audit_trail' as table_check, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'expense_audit_trail'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check if expense_attachments table exists  
SELECT 'expense_attachments' as table_check,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'expense_attachments'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 3. Check current expenses table structure (key columns)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'expenses'
AND column_name IN ('expense_number', 'data_hash', 'is_locked', 'created_ip', 'created_user_agent')
ORDER BY column_name;

-- 4. Try to count audit trail records (will fail if table doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_audit_trail') THEN
    RAISE NOTICE 'Audit trail records: %', (SELECT COUNT(*) FROM expense_audit_trail);
  ELSE
    RAISE NOTICE 'Audit trail table does not exist';
  END IF;
END $$;

-- 5. Check if there are any triggers on expenses table
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'expenses'
AND trigger_schema = 'public';

-- 6. Get a sample expense ID for testing
SELECT id, description, amount_paise, 
       CASE WHEN expense_number IS NOT NULL THEN 'HAS_NUMBER' ELSE 'NO_NUMBER' END as number_status,
       CASE WHEN data_hash IS NOT NULL THEN 'HAS_HASH' ELSE 'NO_HASH' END as hash_status
FROM expenses
ORDER BY created_at DESC
LIMIT 3;