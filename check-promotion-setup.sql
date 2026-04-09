-- ============================================================================
-- DIAGNOSTIC: Check Promotion System Setup
-- ============================================================================
-- Run this to see what's missing and what exists
-- ============================================================================

-- Check if new columns exist in students table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name IN ('last_promoted_at', 'promotion_eligible', 'promotion_hold_reason')
ORDER BY column_name;

-- Check if promotion tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('student_year_snapshots', 'promotion_batches', 'student_promotion_history', 'fee_adjustments') 
    THEN '✓ Exists'
    ELSE '✗ Missing'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('student_year_snapshots', 'promotion_batches', 'student_promotion_history', 'fee_adjustments')
ORDER BY table_name;

-- Check if promotion functions exist
SELECT 
  routine_name,
  '✓ Exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_students_for_promotion',
    'promote_student_transaction',
    'bulk_promote_students',
    'check_promotion_eligibility'
  )
ORDER BY routine_name;

-- Check current students count
SELECT 
  ay.year_label,
  ay.is_current,
  COUNT(s.id) as student_count
FROM academic_years ay
LEFT JOIN students s ON s.academic_year_id = ay.id AND s.is_deleted = FALSE AND s.status = 'active'
GROUP BY ay.id, ay.year_label, ay.is_current
ORDER BY ay.start_date DESC
LIMIT 5;

-- Test the function with current year
DO $$
DECLARE
  v_current_year_id UUID;
  v_student_count INTEGER;
BEGIN
  -- Get current year
  SELECT id INTO v_current_year_id
  FROM academic_years
  WHERE is_current = TRUE
  LIMIT 1;
  
  IF v_current_year_id IS NULL THEN
    RAISE NOTICE '⚠ No current academic year found!';
  ELSE
    RAISE NOTICE '✓ Current academic year ID: %', v_current_year_id;
    
    -- Count students
    SELECT COUNT(*) INTO v_student_count
    FROM students
    WHERE academic_year_id = v_current_year_id
      AND is_deleted = FALSE
      AND status = 'active';
    
    RAISE NOTICE '✓ Students in current year: %', v_student_count;
  END IF;
END $$;
