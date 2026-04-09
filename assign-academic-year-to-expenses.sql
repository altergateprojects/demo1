-- Assign Academic Year to Existing Expenses

-- 1. Check current state
SELECT 
  e.id,
  e.description,
  e.expense_date,
  e.academic_year_id,
  ay.year_label as current_assigned_year
FROM expenses e
LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
WHERE e.is_deleted = false;

-- 2. Show available academic years
SELECT 
  id,
  year_label,
  start_date,
  end_date,
  is_current
FROM academic_years
ORDER BY start_date DESC;

-- 3. Update expenses to assign academic year based on expense_date
UPDATE expenses e
SET academic_year_id = (
  SELECT ay.id
  FROM academic_years ay
  WHERE e.expense_date >= ay.start_date 
  AND e.expense_date <= ay.end_date
  LIMIT 1
)
WHERE e.academic_year_id IS NULL
AND e.is_deleted = false;

-- 4. If no match found (expense date outside any academic year), assign to current year
UPDATE expenses e
SET academic_year_id = (
  SELECT id FROM academic_years WHERE is_current = true LIMIT 1
)
WHERE e.academic_year_id IS NULL
AND e.is_deleted = false;

-- 5. Verify the update
SELECT 
  e.id,
  e.description,
  e.expense_date,
  e.academic_year_id,
  ay.year_label as assigned_year,
  ay.is_current
FROM expenses e
LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
WHERE e.is_deleted = false;

-- 6. Show summary
SELECT 
  CASE 
    WHEN academic_year_id IS NULL THEN 'No Year Assigned'
    ELSE 'Year Assigned'
  END as status,
  COUNT(*) as count
FROM expenses
WHERE is_deleted = false
GROUP BY 
  CASE 
    WHEN academic_year_id IS NULL THEN 'No Year Assigned'
    ELSE 'Year Assigned'
  END;

-- Success message
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM expenses
  WHERE academic_year_id IS NOT NULL
  AND is_deleted = false;
  
  RAISE NOTICE '✓ Academic years assigned to expenses';
  RAISE NOTICE '✓ Total active expenses with year: %', updated_count;
END $$;
