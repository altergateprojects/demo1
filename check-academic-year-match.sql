-- Check if academic year IDs match

-- 1. Show current academic year
SELECT 
  id,
  year_label,
  is_current,
  start_date,
  end_date
FROM academic_years
WHERE is_current = true;

-- 2. Show what academic year the expenses are assigned to
SELECT DISTINCT
  e.academic_year_id,
  ay.year_label,
  ay.is_current,
  COUNT(*) as expense_count
FROM expenses e
LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
WHERE e.is_deleted = false
GROUP BY e.academic_year_id, ay.year_label, ay.is_current;

-- 3. Check if they match
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM expenses e
      JOIN academic_years ay ON ay.id = e.academic_year_id
      WHERE e.is_deleted = false 
      AND ay.is_current = true
    ) THEN '✓ MATCH: Expenses are in current academic year'
    ELSE '✗ MISMATCH: Expenses are NOT in current academic year'
  END as status;
