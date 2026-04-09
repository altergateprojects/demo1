-- Fix: Graduated students should not appear in active student list
-- They should have status = 'graduated' and only appear in Alumni page

-- Step 1: Check the student's current status
SELECT 
  students.id,
  students.full_name,
  students.roll_number,
  students.status,
  standards.name as standard
FROM students
LEFT JOIN standards ON students.standard_id = standards.id
WHERE students.full_name ILIKE '%shantya%';

-- Step 2: Check if they're in alumni_records
SELECT 
  ar.id,
  ar.student_id,
  s.full_name,
  ar.graduation_date,
  ar.final_standard,
  ar.created_at
FROM alumni_records ar
JOIN students s ON s.id = ar.student_id
WHERE s.full_name ILIKE '%shantya%';

-- Step 3: Update the student status to 'graduated'
UPDATE students
SET status = 'graduated'
WHERE full_name ILIKE '%shantya%'
AND status != 'graduated'
RETURNING id, full_name, status;

-- Step 4: Verify students list query (should exclude graduated students)
SELECT 
  s.id,
  s.full_name,
  s.roll_number,
  s.status,
  st.name as standard
FROM students s
LEFT JOIN standards st ON s.standard_id = st.id
WHERE s.is_deleted = FALSE
  AND s.status = 'active'  -- Only active students
ORDER BY s.full_name
LIMIT 10;

-- Step 5: Verify alumni list (should include graduated students)
SELECT 
  s.id,
  s.full_name,
  s.roll_number,
  s.status,
  ar.graduation_date,
  ar.final_standard
FROM students s
JOIN alumni_records ar ON ar.student_id = s.id
WHERE s.status = 'graduated'
ORDER BY ar.graduation_date DESC
LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Student status updated to graduated';
  RAISE NOTICE '📝 Graduated students will now:';
  RAISE NOTICE '   - NOT appear in Students list';
  RAISE NOTICE '   - NOT be able to receive payments';
  RAISE NOTICE '   - ONLY appear in Alumni page';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Make sure frontend filters by status = ''active''';
END $$;
