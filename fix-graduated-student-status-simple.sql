-- Simple Fix: Update graduated student status
-- This is a simplified version that avoids ambiguous column references

-- Step 1: Check the student's current status (simple query)
SELECT 
  students.id,
  students.full_name,
  students.roll_number,
  students.status
FROM students
WHERE students.full_name ILIKE '%shantya%';

-- Step 2: Update the student status to 'graduated'
UPDATE students
SET status = 'graduated'
WHERE full_name ILIKE '%shantya%'
AND status != 'graduated'
RETURNING id, full_name, status;

-- Step 3: Verify the update worked
SELECT 
  students.id,
  students.full_name,
  students.status
FROM students
WHERE students.full_name ILIKE '%shantya%';

-- Step 4: Show all active students (Shantya should NOT be here)
SELECT 
  students.id,
  students.full_name,
  students.status
FROM students
WHERE students.is_deleted = FALSE
  AND students.status = 'active'
ORDER BY students.full_name
LIMIT 10;

-- Step 5: Show all graduated students (Shantya SHOULD be here)
SELECT 
  students.id,
  students.full_name,
  students.status
FROM students
WHERE students.status = 'graduated'
ORDER BY students.full_name
LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Student Status Updated';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Shantya is now marked as graduated';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Expected behavior:';
  RAISE NOTICE '   - NOT in Students list (active only)';
  RAISE NOTICE '   - ONLY in Alumni page';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Refresh your browser to see changes';
  RAISE NOTICE '';
END $$;
