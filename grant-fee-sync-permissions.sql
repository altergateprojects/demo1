-- Grant permissions for fee sync functions
-- Run this in Supabase SQL Editor after running fix-fee-tables-corrected.sql

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION update_student_fees_from_config(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_student_fees() TO authenticated;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS fee_config_update_student_fees ON fee_configurations;
CREATE TRIGGER fee_config_update_student_fees
    AFTER INSERT OR UPDATE ON fee_configurations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_student_fees();

-- Success message
SELECT 'Fee sync permissions granted successfully' AS status;