-- Fix Current Academic Year
-- This script updates the is_current flag to match the real-world current academic year

-- First, check what academic years exist
SELECT 
  id,
  year_label,
  start_date,
  end_date,
  is_current,
  CASE 
    WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'Should be current'
    ELSE 'Not current'
  END as status
FROM academic_years
ORDER BY start_date DESC;

-- Update: Set all years to not current first
UPDATE academic_years
SET is_current = FALSE;

-- Then set the correct current year based on today's date
UPDATE academic_years
SET is_current = TRUE
WHERE CURRENT_DATE BETWEEN start_date AND end_date;

-- Verify the change
SELECT 
  id,
  year_label,
  start_date,
  end_date,
  is_current,
  CASE 
    WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✓ Correct'
    WHEN is_current THEN '✗ Wrong (not in date range)'
    ELSE 'Not current'
  END as verification
FROM academic_years
ORDER BY start_date DESC;

-- If no year matches current date, create the current academic year
DO $$
DECLARE
  v_current_year_exists BOOLEAN;
  v_current_month INT;
  v_current_year INT;
  v_academic_start_year INT;
  v_year_label TEXT;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Check if any year is marked as current
  SELECT EXISTS(
    SELECT 1 FROM academic_years WHERE is_current = TRUE
  ) INTO v_current_year_exists;
  
  -- If no current year exists, create one
  IF NOT v_current_year_exists THEN
    -- Get current month and year
    v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Academic year starts in June (month 6)
    -- If current month is before June, we're in previous academic year
    IF v_current_month >= 6 THEN
      v_academic_start_year := v_current_year;
    ELSE
      v_academic_start_year := v_current_year - 1;
    END IF;
    
    -- Generate year label (e.g., "2024-25")
    v_year_label := v_academic_start_year || '-' || LPAD((v_academic_start_year + 1 - 2000)::TEXT, 2, '0');
    
    -- Set date range (June 1 to May 31)
    v_start_date := (v_academic_start_year || '-06-01')::DATE;
    v_end_date := ((v_academic_start_year + 1) || '-05-31')::DATE;
    
    -- Check if this year already exists
    IF NOT EXISTS(SELECT 1 FROM academic_years WHERE year_label = v_year_label) THEN
      -- Insert the current academic year
      INSERT INTO academic_years (year_label, start_date, end_date, is_current)
      VALUES (v_year_label, v_start_date, v_end_date, TRUE);
      
      RAISE NOTICE 'Created current academic year: %', v_year_label;
    ELSE
      -- Update existing year to be current
      UPDATE academic_years
      SET is_current = TRUE
      WHERE year_label = v_year_label;
      
      RAISE NOTICE 'Updated existing academic year % to current', v_year_label;
    END IF;
  END IF;
END $$;

-- Final verification
SELECT 
  year_label,
  start_date,
  end_date,
  is_current,
  CASE 
    WHEN is_current THEN '✓ CURRENT YEAR'
    ELSE ''
  END as status
FROM academic_years
ORDER BY start_date DESC
LIMIT 10;
