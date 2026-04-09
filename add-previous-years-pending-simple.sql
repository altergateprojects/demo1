-- Add previous years pending fees to students table
-- Uses student_dues table to calculate carried forward amounts from previous years

-- Add the column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_years_pending_paise BIGINT DEFAULT 0;

-- Create a function to calculate previous years pending from student_dues
CREATE OR REPLACE FUNCTION calculate_previous_years_pending(p_student_id UUID, p_current_academic_year_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_pending BIGINT := 0;
BEGIN
  -- Sum all pending dues from previous academic years
  -- student_dues table has: student_id, academic_year_id, amount_paise, amount_paid_paise
  SELECT COALESCE(SUM(amount_paise - amount_paid_paise), 0)
  INTO v_previous_pending
  FROM student_dues
  WHERE student_id = p_student_id
    AND academic_year_id != p_current_academic_year_id
    AND (amount_paise - amount_paid_paise) > 0;  -- Only unpaid amounts
  
  RETURN v_previous_pending;
END;
$$;

-- Update all students with their previous years pending
-- This calculates from student_dues table
UPDATE students s
SET previous_years_pending_paise = (
  SELECT COALESCE(SUM(sd.amount_paise - sd.amount_paid_paise), 0)
  FROM student_dues sd
  WHERE sd.student_id = s.id
    AND sd.academic_year_id != s.academic_year_id
    AND (sd.amount_paise - sd.amount_paid_paise) > 0
);

-- Create a trigger to auto-update when dues are paid or added
CREATE OR REPLACE FUNCTION update_student_previous_years_pending_from_dues()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the student's previous years pending
  UPDATE students
  SET previous_years_pending_paise = (
    SELECT COALESCE(SUM(amount_paise - amount_paid_paise), 0)
    FROM student_dues
    WHERE student_id = NEW.student_id
      AND academic_year_id != (SELECT academic_year_id FROM students WHERE id = NEW.student_id)
      AND (amount_paise - amount_paid_paise) > 0
  )
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_previous_years_pending_from_dues ON student_dues;

-- Create trigger on student_dues table
CREATE TRIGGER trigger_update_previous_years_pending_from_dues
AFTER INSERT OR UPDATE ON student_dues
FOR EACH ROW
EXECUTE FUNCTION update_student_previous_years_pending_from_dues();

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_previous_years_pending(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_previous_years_pending_from_dues() TO authenticated;

-- Add comment
COMMENT ON COLUMN students.previous_years_pending_paise IS 'Total pending fees from previous academic years (calculated from student_dues table)';

-- Verify the update
SELECT 
  s.id,
  s.full_name,
  s.roll_number,
  s.previous_years_pending_paise as previous_years_pending,
  s.annual_fee_paise as current_year_fee,
  s.fee_paid_paise as current_year_paid,
  (s.annual_fee_paise - s.fee_paid_paise) as current_year_pending,
  (s.previous_years_pending_paise + (s.annual_fee_paise - s.fee_paid_paise)) as total_pending,
  ay.year_label as current_year
FROM students s
LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
WHERE s.previous_years_pending_paise > 0
ORDER BY s.previous_years_pending_paise DESC
LIMIT 10;

-- Show summary
SELECT 
  COUNT(*) as students_with_previous_pending,
  SUM(previous_years_pending_paise) as total_previous_pending,
  AVG(previous_years_pending_paise) as avg_previous_pending,
  MAX(previous_years_pending_paise) as max_previous_pending
FROM students
WHERE previous_years_pending_paise > 0;
