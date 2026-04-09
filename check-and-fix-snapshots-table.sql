-- Check and Fix Student Year Snapshots Table

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'student_year_snapshots'
) as table_exists;

-- 2. If table exists, check its structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'student_year_snapshots'
ORDER BY ordinal_position;

-- 3. Check if there's any data
SELECT COUNT(*) as snapshot_count
FROM student_year_snapshots;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'student_year_snapshots';

-- 5. Grant permissions if needed
GRANT SELECT, INSERT, UPDATE ON student_year_snapshots TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6. Enable RLS if not enabled
ALTER TABLE student_year_snapshots ENABLE ROW LEVEL SECURITY;

-- 7. Create basic RLS policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_year_snapshots' 
    AND policyname = 'Users can view snapshots'
  ) THEN
    CREATE POLICY "Users can view snapshots"
      ON student_year_snapshots
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 8. Sample data from the table
SELECT 
  sys.id,
  sys.student_id,
  s.full_name,
  sys.academic_year_id,
  ay.year_label,
  sys.standard_id,
  st.name as standard_name,
  sys.dues_carried_forward_paise,
  sys.fee_due_paise,
  sys.snapshot_date
FROM student_year_snapshots sys
LEFT JOIN students s ON s.id = sys.student_id
LEFT JOIN academic_years ay ON ay.id = sys.academic_year_id
LEFT JOIN standards st ON st.id = sys.standard_id
ORDER BY sys.snapshot_date DESC
LIMIT 10;

-- 9. Check for specific student
SELECT 
  sys.*,
  ay.year_label,
  st.name as standard_name
FROM student_year_snapshots sys
LEFT JOIN academic_years ay ON ay.id = sys.academic_year_id
LEFT JOIN standards st ON st.id = sys.standard_id
WHERE sys.student_id = '1c082a4b-ad18-4523-9de3-290d2596a934'
ORDER BY sys.snapshot_date DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Snapshot table check complete';
  RAISE NOTICE '✓ Permissions granted';
  RAISE NOTICE '✓ RLS policies checked';
END $$;
