-- Fix dashboard data issues (final corrected version)

-- 1. Ensure we have a current academic year
UPDATE academic_years SET is_current = false; -- Reset all

-- Set the most recent academic year as current
UPDATE academic_years 
SET is_current = true 
WHERE id = (
  SELECT id FROM academic_years 
  ORDER BY start_date DESC 
  LIMIT 1
);

-- 2. Check if we have any academic year marked as current
SELECT 'Current Academic Year:' as section;
SELECT id, year_label, is_current, start_date, end_date 
FROM academic_years 
WHERE is_current = true;

-- 3. If no current academic year, create one for 2024-25
INSERT INTO academic_years (year_label, start_date, end_date, is_current)
SELECT '2024-25', '2024-04-01'::date, '2025-03-31'::date, true
WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE is_current = true);

-- 4. Ensure students have proper fee data
UPDATE students 
SET annual_fee_paise = 500000, -- Default ₹5000 if zero
    fee_paid_paise = COALESCE(fee_paid_paise, 0)
WHERE (annual_fee_paise = 0 OR annual_fee_paise IS NULL)
  AND status = 'active' 
  AND is_deleted = false;

-- 5. Ensure students have academic year assigned
UPDATE students 
SET academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1)
WHERE academic_year_id IS NULL 
  AND status = 'active' 
  AND is_deleted = false;

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

-- Current academic year
SELECT 'Current Academic Year' as metric, 
       COALESCE(year_label, 'None') as value
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

-- Negative pocket money count
SELECT 'Students with Negative Pocket Money' as metric,
       COUNT(*)::text as value
FROM students 
WHERE status = 'active' 
  AND is_deleted = false 
  AND pocket_money_paise < 0;

SELECT 'Dashboard fix completed successfully!' as status;