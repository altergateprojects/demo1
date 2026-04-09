-- Add previous years pending fees calculation to students view
-- This shows carried forward pending fees from previous academic years

-- First, create a function to calculate previous years pending
CREATE OR REPLACE FUNCTION get_student_previous_years_pending(p_student_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_previous_pending BIGINT := 0;
BEGIN
  -- Sum up all previous years' pending fees from snapshots
  -- Snapshots are created during promotion and store the pending amount at that time
  SELECT COALESCE(SUM(pending_fee_paise), 0)
  INTO v_total_previous_pending
  FROM student_promotion_snapshots
  WHERE student_id = p_student_id
    AND pending_fee_paise > 0;
  
  RETURN v_total_previous_pending;
END;
$$;

-- Update the students view to include previous years pending
-- Note: This assumes you're using a view. If students is a table, we'll need a different approach.

-- Option 1: If using a view, recreate it with the new field
-- (You'll need to adjust this based on your actual view definition)

-- Option 2: Add a computed column (PostgreSQL 12+)
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_years_pending_paise BIGINT GENERATED ALWAYS AS (
--   (SELECT COALESCE(SUM(pending_fee_paise), 0) FROM student_promotion_snapshots WHERE student_id = students.id)
-- ) STORED;

-- Option 3: Add a regular column and update it via trigger (most compatible)
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_years_pending_paise BIGINT DEFAULT 0;

-- Create a function to update previous years pending
CREATE OR REPLACE FUNCTION update_student_previous_years_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a snapshot is created/updated, update the student's previous years pending
  UPDATE students
  SET previous_years_pending_paise = (
    SELECT COALESCE(SUM(pending_fee_paise), 0)
    FROM student_promotion_snapshots
    WHERE student_id = NEW.student_id
      AND pending_fee_paise > 0
  )
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on snapshots table
DROP TRIGGER IF EXISTS trigger_update_previous_years_pending ON student_promotion_snapshots;
CREATE TRIGGER trigger_update_previous_years_pending
AFTER INSERT OR UPDATE ON student_promotion_snapshots
FOR EACH ROW
EXECUTE FUNCTION update_student_previous_years_pending();

-- Initial population: Update all existing students
UPDATE students s
SET previous_years_pending_paise = (
  SELECT COALESCE(SUM(pending_fee_paise), 0)
  FROM student_promotion_snapshots sps
  WHERE sps.student_id = s.id
    AND sps.pending_fee_paise > 0
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_student_previous_years_pending(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_previous_years_pending() TO authenticated;

-- Add comment
COMMENT ON COLUMN students.previous_years_pending_paise IS 'Total pending fees carried forward from previous academic years (from promotion snapshots)';

-- Verify the update
SELECT 
  id,
  full_name,
  roll_number,
  previous_years_pending_paise,
  annual_fee_paise,
  fee_paid_paise,
  (annual_fee_paise - fee_paid_paise) as current_year_pending,
  (previous_years_pending_paise + (annual_fee_paise - fee_paid_paise)) as total_pending
FROM students
WHERE previous_years_pending_paise > 0
ORDER BY previous_years_pending_paise DESC
LIMIT 10;
