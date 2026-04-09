-- Check all transaction-related tables and their structure

-- 1. List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check fee_payments table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fee_payments'
ORDER BY ordinal_position;

-- 3. Check if there's a fee_configurations join
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'fee_configurations'
) as fee_configurations_exists;

-- 4. Sample fee_payments data
SELECT 
  id,
  student_id,
  amount_paise,
  payment_date,
  payment_method,
  payment_reference,
  created_at
FROM fee_payments
LIMIT 3;

-- 5. Check student_due_payments structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'student_due_payments'
ORDER BY ordinal_position;

-- 6. Sample student_due_payments data
SELECT 
  id,
  student_due_id,
  payment_amount_paise,
  payment_date,
  payment_method,
  created_at
FROM student_due_payments
LIMIT 3;
