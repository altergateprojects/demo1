-- ============================================================================
-- FIX TEACHER SALARY PAYMENTS TABLE COLUMNS
-- ============================================================================
-- This will check your actual table structure and add any missing columns
-- ============================================================================

-- Step 1: Show current columns
SELECT 
  '=== CURRENT COLUMNS IN teacher_salary_payments ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_salary_payments'
ORDER BY ordinal_position;

-- Step 2: Check if 'performed_by' column exists (it should)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_salary_payments'
    AND column_name = 'performed_by'
  ) THEN
    RAISE NOTICE '✓ performed_by column EXISTS';
  ELSE
    RAISE NOTICE '✗ performed_by column MISSING - will add it';
    
    -- Add the column if it doesn't exist
    ALTER TABLE teacher_salary_payments 
    ADD COLUMN performed_by UUID REFERENCES auth.users(id);
    
    RAISE NOTICE '✓ performed_by column ADDED';
  END IF;
END $$;

-- Step 3: Check if 'recorded_by' column exists (old name, should not exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_salary_payments'
    AND column_name = 'recorded_by'
  ) THEN
    RAISE NOTICE '⚠ recorded_by column EXISTS (old name)';
    RAISE NOTICE '  Consider renaming it to performed_by for consistency';
  ELSE
    RAISE NOTICE '✓ recorded_by column does not exist (good)';
  END IF;
END $$;

-- Step 4: Show sample data structure
SELECT 
  '=== SAMPLE DATA (first row) ===' as info;

SELECT *
FROM teacher_salary_payments
LIMIT 1;

-- Step 5: Show foreign key constraints
SELECT 
  '=== FOREIGN KEY CONSTRAINTS ===' as info;

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'teacher_salary_payments';

-- Done
SELECT '=== ANALYSIS COMPLETE ===' as info;
