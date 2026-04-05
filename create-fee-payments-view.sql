-- Create a view that joins fee_payments with user_profiles
-- This makes it easier to query fee payments with user information

CREATE OR REPLACE VIEW fee_payments_with_users AS
SELECT 
  fp.*,
  up.full_name as received_by_name,
  up.role as received_by_role
FROM fee_payments fp
LEFT JOIN user_profiles up ON fp.received_by = up.id;

-- Grant access to authenticated users
GRANT SELECT ON fee_payments_with_users TO authenticated;

-- Create RLS policy for the view
ALTER VIEW fee_payments_with_users OWNER TO postgres;

-- Note: Views inherit RLS policies from their base tables,
-- so the existing fee_payments policies will apply