-- Check Fee Payments Structure and Data
-- This script investigates the fee_payments table to understand how to correctly attribute payments to academic years

-- 1. Check the structure of fee_payments table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fee_payments'
ORDER BY ordinal_position;

-- 2. Check if there's an academic_year_id column
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'fee_payments' 
    AND column_name = 'academic_year_id'
) as has_academic_year_column;

-- 3. Sample fee payments with student info
SELECT 
  fp.id,
  fp.student_id,
  s.full_name,
  s.roll_number,
  fp.payment_date,
  fp.amount_paise,
  fp.receipt_number,
  s.academic_year_id as student_current_year_id,
  ay.year_label as student_current_year,
  s.standard_id as student_current_standard_id,
  st.name as student_current_standard
FROM fee_payments fp
JOIN students s ON s.id = fp.student_id
LEFT JOIN academic_years ay ON ay.id = s.academic_year_id
LEFT JOIN standards st ON st.id = s.standard_id
ORDER BY fp.payment_date DESC
LIMIT 10;

-- 4. Check if student has been promoted (has snapshots)
SELECT 
  s.id as student_id,
  s.full_name,
  s.roll_number,
  s.academic_year_id as current_year_id,
  ay_current.year_label as current_year,
  s.standard_id as current_standard_id,
  st_current.name as current_standard,
  COUNT(sys.id) as promotion_count,
  array_agg(ay_snap.year_label ORDER BY sys.snapshot_date) as previous_years
FROM students s
LEFT JOIN academic_years ay_current ON ay_current.id = s.academic_year_id
LEFT JOIN standards st_current ON st_current.id = s.standard_id
LEFT JOIN student_year_snapshots sys ON sys.student_id = s.id
LEFT JOIN academic_years ay_snap ON ay_snap.id = sys.academic_year_id
WHERE s.is_deleted = FALSE
GROUP BY s.id, s.full_name, s.roll_number, s.academic_year_id, ay_current.year_label, s.standard_id, st_current.name
HAVING COUNT(sys.id) > 0
ORDER BY s.full_name
LIMIT 10;

-- 5. For a specific student, show their payment history and promotion history
-- Replace 'STUDENT_ID_HERE' with actual student ID
DO $$
DECLARE
  v_student_id UUID;
  v_student_name TEXT;
BEGIN
  -- Get first promoted student
  SELECT s.id, s.full_name INTO v_student_id, v_student_name
  FROM students s
  WHERE EXISTS (SELECT 1 FROM student_year_snapshots WHERE student_id = s.id)
  LIMIT 1;
  
  IF v_student_id IS NOT NULL THEN
    RAISE NOTICE '=== Student: % (ID: %) ===', v_student_name, v_student_id;
    
    RAISE NOTICE 'Fee Payments:';
    FOR rec IN 
      SELECT 
        payment_date,
        amount_paise,
        receipt_number,
        payment_method
      FROM fee_payments
      WHERE student_id = v_student_id
      ORDER BY payment_date
    LOOP
      RAISE NOTICE '  Date: %, Amount: %, Receipt: %', 
        rec.payment_date, rec.amount_paise, rec.receipt_number;
    END LOOP;
    
    RAISE NOTICE 'Promotion History (Snapshots):';
    FOR rec IN
      SELECT 
        sys.snapshot_date,
        ay.year_label as year,
        st.name as standard,
        sys.annual_fee_paise,
        sys.fee_paid_paise,
        sys.promotion_status
      FROM student_year_snapshots sys
      JOIN academic_years ay ON ay.id = sys.academic_year_id
      JOIN standards st ON st.id = sys.standard_id
      WHERE sys.student_id = v_student_id
      ORDER BY sys.snapshot_date
    LOOP
      RAISE NOTICE '  Year: %, Standard: %, Fee Paid: %, Status: %',
        rec.year, rec.standard, rec.fee_paid_paise, rec.promotion_status;
    END LOOP;
  END IF;
END $$;
