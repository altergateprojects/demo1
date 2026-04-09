-- Alumni System Database Schema
-- Run this in Supabase SQL Editor

-- 1. Update students table status constraint to include new statuses
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE students 
ADD CONSTRAINT students_status_check 
CHECK (status IN ('active', 'inactive', 'withdrawn', 'graduated', 'left_school'));

-- 2. Create alumni_records table for graduated students
CREATE TABLE IF NOT EXISTS alumni_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  graduation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  final_standard_id UUID REFERENCES standards(id),
  final_academic_year_id UUID REFERENCES academic_years(id),
  achievements TEXT,
  remarks TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  current_occupation VARCHAR(255),
  current_institution VARCHAR(255),
  linkedin_profile VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for alumni_records
CREATE INDEX IF NOT EXISTS idx_alumni_student_id ON alumni_records(student_id);
CREATE INDEX IF NOT EXISTS idx_alumni_graduation_date ON alumni_records(graduation_date DESC);
CREATE INDEX IF NOT EXISTS idx_alumni_final_year ON alumni_records(final_academic_year_id);

-- 3. Create left_school_records table for students who left
CREATE TABLE IF NOT EXISTS left_school_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  exit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exit_reason VARCHAR(255) NOT NULL,
  last_standard_id UUID REFERENCES standards(id),
  last_academic_year_id UUID REFERENCES academic_years(id),
  remarks TEXT,
  transfer_certificate_issued BOOLEAN DEFAULT FALSE,
  transfer_certificate_number VARCHAR(100),
  transfer_certificate_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for left_school_records
CREATE INDEX IF NOT EXISTS idx_left_school_student_id ON left_school_records(student_id);
CREATE INDEX IF NOT EXISTS idx_left_school_exit_date ON left_school_records(exit_date DESC);
CREATE INDEX IF NOT EXISTS idx_left_school_last_year ON left_school_records(last_academic_year_id);

-- 4. Enable RLS on new tables
ALTER TABLE alumni_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE left_school_records ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for alumni_records
CREATE POLICY "Allow authenticated users to view alumni records"
  ON alumni_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert alumni records"
  ON alumni_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update alumni records"
  ON alumni_records FOR UPDATE
  TO authenticated
  USING (true);

-- 6. Create RLS policies for left_school_records
CREATE POLICY "Allow authenticated users to view left school records"
  ON left_school_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert left school records"
  ON left_school_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update left school records"
  ON left_school_records FOR UPDATE
  TO authenticated
  USING (true);

-- 7. Create function to mark student as graduated
CREATE OR REPLACE FUNCTION mark_student_as_graduated(
  p_student_id UUID,
  p_graduation_date DATE DEFAULT CURRENT_DATE,
  p_achievements TEXT DEFAULT NULL,
  p_remarks TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_student RECORD;
  v_result JSON;
BEGIN
  -- Get student details
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- Update student status to graduated
  UPDATE students 
  SET status = 'graduated',
      updated_at = NOW()
  WHERE id = p_student_id;
  
  -- Create or update alumni record
  INSERT INTO alumni_records (
    student_id,
    graduation_date,
    final_standard_id,
    final_academic_year_id,
    achievements,
    remarks,
    created_by
  ) VALUES (
    p_student_id,
    p_graduation_date,
    v_student.standard_id,
    v_student.academic_year_id,
    p_achievements,
    p_remarks,
    auth.uid()
  )
  ON CONFLICT (student_id) 
  DO UPDATE SET
    graduation_date = EXCLUDED.graduation_date,
    achievements = EXCLUDED.achievements,
    remarks = EXCLUDED.remarks,
    updated_at = NOW();
  
  v_result := json_build_object(
    'success', true,
    'student_id', p_student_id,
    'student_name', v_student.full_name,
    'message', 'Student marked as graduated successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to mark student as left school
CREATE OR REPLACE FUNCTION mark_student_as_left_school(
  p_student_id UUID,
  p_exit_date DATE DEFAULT CURRENT_DATE,
  p_exit_reason VARCHAR(255),
  p_remarks TEXT DEFAULT NULL,
  p_tc_issued BOOLEAN DEFAULT FALSE,
  p_tc_number VARCHAR(100) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_student RECORD;
  v_result JSON;
BEGIN
  -- Get student details
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- Update student status to left_school
  UPDATE students 
  SET status = 'left_school',
      updated_at = NOW()
  WHERE id = p_student_id;
  
  -- Create or update left school record
  INSERT INTO left_school_records (
    student_id,
    exit_date,
    exit_reason,
    last_standard_id,
    last_academic_year_id,
    remarks,
    transfer_certificate_issued,
    transfer_certificate_number,
    transfer_certificate_date,
    created_by
  ) VALUES (
    p_student_id,
    p_exit_date,
    p_exit_reason,
    v_student.standard_id,
    v_student.academic_year_id,
    p_remarks,
    p_tc_issued,
    p_tc_number,
    CASE WHEN p_tc_issued THEN CURRENT_DATE ELSE NULL END,
    auth.uid()
  )
  ON CONFLICT (student_id) 
  DO UPDATE SET
    exit_date = EXCLUDED.exit_date,
    exit_reason = EXCLUDED.exit_reason,
    remarks = EXCLUDED.remarks,
    transfer_certificate_issued = EXCLUDED.transfer_certificate_issued,
    transfer_certificate_number = EXCLUDED.transfer_certificate_number,
    transfer_certificate_date = EXCLUDED.transfer_certificate_date,
    updated_at = NOW();
  
  v_result := json_build_object(
    'success', true,
    'student_id', p_student_id,
    'student_name', v_student.full_name,
    'message', 'Student marked as left school successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_student_as_graduated TO authenticated;
GRANT EXECUTE ON FUNCTION mark_student_as_left_school TO authenticated;

-- 10. Create view for alumni with student details
CREATE OR REPLACE VIEW alumni_with_details AS
SELECT 
  ar.*,
  s.full_name,
  s.roll_number,
  s.gender,
  s.dob,
  s.guardian_name,
  s.phone,
  s.address,
  st.name as final_standard_name,
  ay.year_label as final_academic_year
FROM alumni_records ar
JOIN students s ON ar.student_id = s.id
LEFT JOIN standards st ON ar.final_standard_id = st.id
LEFT JOIN academic_years ay ON ar.final_academic_year_id = ay.id
WHERE s.status = 'graduated'
ORDER BY ar.graduation_date DESC;

-- 11. Create view for left school students with details
CREATE OR REPLACE VIEW left_school_with_details AS
SELECT 
  lsr.*,
  s.full_name,
  s.roll_number,
  s.gender,
  s.dob,
  s.guardian_name,
  s.phone,
  s.address,
  st.name as last_standard_name,
  ay.year_label as last_academic_year
FROM left_school_records lsr
JOIN students s ON lsr.student_id = s.id
LEFT JOIN standards st ON lsr.last_standard_id = st.id
LEFT JOIN academic_years ay ON lsr.last_academic_year_id = ay.id
WHERE s.status = 'left_school'
ORDER BY lsr.exit_date DESC;

-- Success message
SELECT 'Alumni system schema created successfully!' as status;