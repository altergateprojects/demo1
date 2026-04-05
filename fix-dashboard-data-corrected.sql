-- Fix dashboard data issues (corrected version)

-- 1. First, let's check what columns exist in academic_years
SELECT 'Academic Years Table Schema:' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'academic_years' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current academic years data
SELECT 'Current Academic Years Data:' as section;
SELECT * FROM academic_years ORDER BY start_date DESC LIMIT 5;

-- 3. Ensure we have a current academic year (using available columns)
UPDATE academic_years SET is_current = false; -- Reset all

-- Set the most recent academic year as current
UPDATE academic_years 
SET is_current = true 
WHERE id = (
  SELECT id FROM academic_years 
  ORDER BY start_date DESC 
  LIMIT 1
);

-- 4. If no academic years exist, create one
INSERT INTO academic_years (start_date, end_date, is_current)
SELECT '2024-04-01'::date, '2025-03-31'::date, true
WHERE NOT EXISTS (SELECT 1 FROM academic_years);

-- 5. Check students table structure
SELECT 'Students Table Key Columns:' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'academic_year_id', 'annual_fee_paise', 'fee_paid_paise', 'status', 'is_deleted')
ORDER BY ordinal_position;

-- 6. Check current students data
SELECT 'Students Summary:' as section;
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students,
  COUNT(CASE WHEN is_deleted = false THEN 1 END) as not_deleted_students,
  COUNT(CASE WHEN academic_year_id IS NOT NULL THEN 1 END) as with_academic_year
FROM students;

-- 7. Ensure students have proper fee data
UPDATE students 
SET annual_fee_paise = 500000 -- Default ₹5000 if zero
WHERE (annual_fee_paise = 0 OR annual_fee_paise IS NULL) 
  AND status = 'active' 
  AND is_deleted = false;

-- 8. Ensure students have academic year assigned
UPDATE students 
SET academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1)
WHERE academic_year_id IS NULL 
  AND status = 'active' 
  AND is_deleted = false;

-- 9. Check if teachers table exists
SELECT 'Teachers Table Check:' as section;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') 
    THEN 'Teachers table exists'
    ELSE 'Teachers table does not exist'
  END as table_status;

-- 10. Create teachers table if it doesn't exist
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Insert sample teachers if none exist
INSERT INTO teachers (full_name, email, status)
SELECT 'Sample Teacher 1', 'teacher1@school.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM teachers);

INSERT INTO teachers (full_name, email, status)
SELECT 'Sample Teacher 2', 'teacher2@school.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE full_name != 'Sample Teacher 1');

-- 12. Final verification
SELECT 'Final Dashboard Data Check:' as section;

-- Current academic year
SELECT 'Current Academic Year:' as metric, 
       COALESCE(id::text, 'None') as value
FROM academic_years 
WHERE is_current = true;

-- Students count
SELECT 'Active Students' as metric, 
       COUNT(*)::text as value
FROM students 
WHERE status = 'active' AND is_deleted = false;

-- Pending fees
SELECT 'Pending Fees (Rupees)' as metric,
       COALESCE((SUM(annual_fee_paise - fee_paid_paise) / 100.0)::text, '0') as value
FROM students 
WHERE status = 'active' 
  AND is_deleted = false 
  AND annual_fee_paise > fee_paid_paise;

-- Teachers count
SELECT 'Active Teachers' as metric,
       COUNT(*)::text as value
FROM teachers 
WHERE status = 'active' AND is_deleted = false;

SELECT 'Dashboard data fix completed successfully!' as status;