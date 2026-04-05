-- Check for recent audit trail entries
SELECT 
  id,
  expense_id,
  action_type,
  field_name,
  old_value,
  new_value,
  change_reason,
  performed_at
FROM expense_audit_trail 
ORDER BY performed_at DESC 
LIMIT 10;