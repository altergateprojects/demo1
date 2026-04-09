-- Fix Academic Year Mismatch for Expenses

-- Option 1: Mark the year that has expenses as the current year
-- (Use this if 2024-25 should be the current year)

-- First, show all academic years
SELECT 
  id,
  year_label,
  is_current,
  start_date,
  end_date
FROM academic_years
ORDER BY start_date DESC;

-- Show which year the expenses are in
SELECT 
  ay.id,
  ay.year_label,
  ay.is_current,
  COUNT(e.id) as expense_count
FROM academic_years ay
LEFT JOIN expenses e ON e.academic_year_id = ay.id AND e.is_deleted = false
GROUP BY ay.id, ay.year_label, ay.is_current
ORDER BY expense_count DESC;

-- SOLUTION 1: Set the year with expenses as current
-- Uncomment these lines if you want to make 2024-25 the current year:
/*
UPDATE academic_years 
SET is_current = false 
WHERE is_current = true;

UPDATE academic_years 
SET is_current = true 
WHERE id = '9ab82863-c3bf-4374-851f-42966211ae36';
*/

-- SOLUTION 2: Move expenses to the current academic year
-- Uncomment these lines if you want to move expenses to 2025-26:
/*
UPDATE expenses
SET academic_year_id = (
  SELECT id FROM academic_years WHERE is_current = true LIMIT 1
)
WHERE is_deleted = false;
*/

-- After choosing a solution, verify:
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM expenses e
      JOIN academic_years ay ON ay.id = e.academic_year_id
      WHERE e.is_deleted = false 
      AND ay.is_current = true
    ) THEN '✓ FIXED: Expenses are now in current academic year'
    ELSE '✗ STILL BROKEN: Expenses are NOT in current academic year'
  END as status;
