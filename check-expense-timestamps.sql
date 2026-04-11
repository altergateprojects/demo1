-- Check expense timestamps to see if updated_at is different from created_at
SELECT 
  id,
  description,
  created_at,
  updated_at,
  CASE 
    WHEN updated_at IS NULL THEN 'No updated_at'
    WHEN updated_at = created_at THEN 'Same timestamp'
    WHEN updated_at > created_at THEN 'UPDATED ✅'
    ELSE 'Unknown'
  END as status,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as seconds_difference
FROM expenses
WHERE is_deleted = false
ORDER BY expense_date DESC
LIMIT 20;

-- Check if any expenses have been updated
SELECT 
  COUNT(*) as total_expenses,
  COUNT(CASE WHEN updated_at > created_at THEN 1 END) as updated_expenses,
  COUNT(CASE WHEN updated_at = created_at THEN 1 END) as not_updated,
  COUNT(CASE WHEN updated_at IS NULL THEN 1 END) as null_updated_at
FROM expenses
WHERE is_deleted = false;
