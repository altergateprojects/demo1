-- Check Student References Function
-- This function checks what records are preventing student deletion

CREATE OR REPLACE FUNCTION check_student_references(p_student_id UUID)
RETURNS TABLE(
    table_name TEXT,
    record_count BIGINT,
    sample_ids TEXT[]
) AS $$
BEGIN
    -- Return all tables that have records referencing this student
    
    -- Check fee_payments
    RETURN QUERY
    SELECT 
        'fee_payments'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(id::TEXT) FILTER (WHERE id IS NOT NULL)
    FROM fee_payments 
    WHERE student_id = p_student_id
    HAVING COUNT(*) > 0;
    
    -- Check student_dues
    RETURN QUERY
    SELECT 
        'student_dues'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(id::TEXT) FILTER (WHERE id IS NOT NULL)
    FROM student_dues 
    WHERE student_id = p_student_id
    HAVING COUNT(*) > 0;
    
    -- Check pocket_money_transactions
    RETURN QUERY
    SELECT 
        'pocket_money_transactions'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(id::TEXT) FILTER (WHERE id IS NOT NULL)
    FROM pocket_money_transactions 
    WHERE student_id = p_student_id
    HAVING COUNT(*) > 0;
    
    -- Check student_year_snapshots
    RETURN QUERY
    SELECT 
        'student_year_snapshots'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(id::TEXT) FILTER (WHERE id IS NOT NULL)
    FROM student_year_snapshots 
    WHERE student_id = p_student_id
    HAVING COUNT(*) > 0;
    
    -- Check student_exit_dues
    RETURN QUERY
    SELECT 
        'student_exit_dues'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(id::TEXT) FILTER (WHERE id IS NOT NULL)
    FROM student_exit_dues 
    WHERE student_id = p_student_id
    HAVING COUNT(*) > 0;
    
    -- Check student_due_payments (indirect reference)
    RETURN QUERY
    SELECT 
        'student_due_payments'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(sdp.id::TEXT) FILTER (WHERE sdp.id IS NOT NULL)
    FROM student_due_payments sdp
    JOIN student_dues sd ON sdp.student_due_id = sd.id
    WHERE sd.student_id = p_student_id
    HAVING COUNT(*) > 0;
    
    -- Check audit_logs
    RETURN QUERY
    SELECT 
        'audit_logs'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(id::TEXT) FILTER (WHERE id IS NOT NULL)
    FROM audit_logs 
    WHERE entity_id = p_student_id::TEXT
    HAVING COUNT(*) > 0;
    
    -- Check any other tables that might exist
    -- Add more checks here as needed
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION check_student_references TO authenticated;

-- Example usage (uncomment and replace with actual student ID):
-- SELECT * FROM check_student_references('5c088761-7a14-46d7-b016-1c5cfb8112c3');

SELECT 'Reference checking function created' as status;