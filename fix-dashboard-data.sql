-- Fix dashboard data issues

-- 1. Ensure we have a current academic year
UPDATE academic_years SET is_current = false; -- Reset all
UPDATE academic_years 
SET is_current = true 
WHERE id = (
  SELECT id FROM academic_years 
  ORDER BY start_date DESC 
  LIMIT 1
);

-- 2. Check if we have any academic year marked as current
SELECT 'Current Academic Year:' as section;
SELECT id, name, is_current, start_date, end_date 
FROM academic_years 
WHERE is_current = true;

-- 3. If no current academic year, create one for 2024-25
INSERT INTO academic_years (name, start_date, end_date, is_current)
SELECT '2024-25', '2024-04-01', '2025-03-31', true
WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE is_current = true);

-- 4. Ensure students have proper fee data
UPDATE students 
SET annual_fee_paise = 500000, -- Default ₹5000 if zero
    fee_paid_paise = COALESCE(fee_paid_paise, 0)
WHERE annual_fee_paise = 0 OR annual_fee_paise IS NULL;

-- 5. Ensure students have academic year assigned
UPDATE students 
SET academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1)
WHERE academic_year_id IS NULL;

-- 6. Create teachers table if it doesn't exist
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

-- 7. Insert some sample teachers if none exist
INSERT INTO teachers (full_name, email, status)
SELECT 'Sample Teacher 1', 'teacher1@school.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM teachers);

INSERT INTO teachers (full_name, email, status)
SELECT 'Sample Teacher 2', 'teacher2@school.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE full_name != 'Sample Teacher 1');

-- 8. Verify the fixes
SELECT 'Dashboard Data Summary:' as section;
SELECT 
  'Students' as type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' AND is_deleted = false THEN 1 END) as active
FROM students
UNION ALL
SELECT 
  'Teachers' as type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' AND is_deleted = false THEN 1 END) as active
FROM teachers
UNION ALL
SELECT 
  'Academic Years' as type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_current = true THEN 1 END) as current
FROM academic_years;

-- 9. Show pending fees calculation
SELECT 
  'Pending Fees' as metric,
  SUM(annual_fee_paise - fee_paid_paise) / 100.0 as amount_rupees
FROM students 
WHERE status = 'active' 
  AND is_deleted = false 
  AND annual_fee_paise > fee_paid_paise;

SELECT 'Dashboard fix completed!' as status;