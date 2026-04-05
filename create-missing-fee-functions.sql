-- 🔧 CREATE MISSING FEE FUNCTIONS
-- This creates the database functions that the fee system needs

-- Function 1: Get fee statistics
CREATE OR REPLACE FUNCTION get_fee_statistics(academic_year_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_expected_paise', COALESCE(SUM(s.annual_fee_paise), 0),
        'total_collected_paise', COALESCE(SUM(s.fee_paid_paise), 0),
        'total_pending_paise', COALESCE(SUM(s.annual_fee_paise - s.fee_paid_paise), 0),
        'students_paid', COUNT(CASE WHEN s.fee_paid_paise >= s.annual_fee_paise THEN 1 END),
        'collection_percentage', 
            CASE 
                WHEN SUM(s.annual_fee_paise) > 0 
                THEN ROUND((SUM(s.fee_paid_paise)::NUMERIC / SUM(s.annual_fee_paise)::NUMERIC * 100), 2)
                ELSE 0 
            END,
        'payment_methods', '[]'::json
    ) INTO result
    FROM students s
    WHERE s.academic_year_id = get_fee_statistics.academic_year_id
    AND s.is_deleted = false;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Update student fees from configuration
CREATE OR REPLACE FUNCTION update_student_fees_from_config(
    p_academic_year_id UUID,
    p_standard_id UUID DEFAULT NULL,
    p_gender VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update students' annual fees based on fee configurations
    UPDATE students s
    SET annual_fee_paise = fc.annual_fee_paise,
        updated_at = NOW()
    FROM fee_configurations fc
    WHERE s.academic_year_id = p_academic_year_id
    AND s.standard_id = fc.standard_id
    AND s.academic_year_id = fc.academic_year_id
    AND fc.is_active = true
    AND (fc.gender = 'all' OR fc.gender = s.gender)
    AND (p_standard_id IS NULL OR s.standard_id = p_standard_id)
    AND (p_gender IS NULL OR s.gender = p_gender)
    AND s.is_deleted = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_fee_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_fees_from_config(UUID, UUID, VARCHAR) TO authenticated;

-- Test the functions
SELECT '=== TESTING FEE FUNCTIONS ===' as info;

-- Test get_fee_statistics
SELECT 
    'Fee Statistics Test:' as test,
    get_fee_statistics(
        (SELECT id FROM academic_years WHERE is_current = true LIMIT 1)
    ) as result;

SELECT '✅ Fee functions created successfully!' as status;