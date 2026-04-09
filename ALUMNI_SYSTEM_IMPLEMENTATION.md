# Alumni & Left School Students System

## Overview
Create a system to manage students who have graduated or left the school, keeping their records for historical purposes.

## Requirements

### 1. Student Status Types
- **Active**: Current students
- **Graduated**: Students who completed their education (Alumni)
- **Left School**: Students who left before completing

### 2. Promotion Modal Changes
When promoting a student:
- If target standard is "Graduate" → Mark student as `status = 'graduated'`
- Student becomes inactive but record is preserved
- Moved to Alumni list

### 3. New Alumni Page
**Route**: `/students/alumni`

**Features**:
- Two tabs: "Alumni (Graduated)" and "Left School"
- Display student information with graduation/exit details
- Search and filter capabilities
- View student history
- Cannot edit or delete (read-only for data integrity)

### 4. Database Changes

#### Update students table status enum:
```sql
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE students 
ADD CONSTRAINT students_status_check 
CHECK (status IN ('active', 'inactive', 'withdrawn', 'graduated', 'left_school'));
```

#### Create alumni_records table:
```sql
CREATE TABLE IF NOT EXISTS alumni_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  graduation_date DATE NOT NULL,
  final_standard_id UUID REFERENCES standards(id),
  final_academic_year_id UUID REFERENCES academic_years(id),
  achievements TEXT,
  remarks TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  current_occupation VARCHAR(255),
  current_institution VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alumni_student_id ON alumni_records(student_id);
CREATE INDEX idx_alumni_graduation_date ON alumni_records(graduation_date);
```

#### Create left_school_records table:
```sql
CREATE TABLE IF NOT EXISTS left_school_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exit_date DATE NOT NULL,
  exit_reason VARCHAR(255) NOT NULL,
  last_standard_id UUID REFERENCES standards(id),
  last_academic_year_id UUID REFERENCES academic_years(id),
  remarks TEXT,
  transfer_certificate_issued BOOLEAN DEFAULT FALSE,
  transfer_certificate_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_left_school_student_id ON left_school_records(student_id);
CREATE INDEX idx_left_school_exit_date ON left_school_records(exit_date);
```

### 5. Promotion Function Update

Update the promotion function to handle graduation:

```sql
CREATE OR REPLACE FUNCTION promote_student_with_graduation(
  p_student_id UUID,
  p_target_standard_id UUID,
  p_target_academic_year_id UUID,
  p_is_graduation BOOLEAN DEFAULT FALSE,
  p_promotion_notes TEXT DEFAULT NULL
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
  
  -- If graduating
  IF p_is_graduation THEN
    -- Update student status to graduated
    UPDATE students 
    SET status = 'graduated',
        updated_at = NOW()
    WHERE id = p_student_id;
    
    -- Create alumni record
    INSERT INTO alumni_records (
      student_id,
      graduation_date,
      final_standard_id,
      final_academic_year_id,
      remarks,
      created_by
    ) VALUES (
      p_student_id,
      CURRENT_DATE,
      v_student.standard_id,
      v_student.academic_year_id,
      p_promotion_notes,
      auth.uid()
    );
    
    v_result := json_build_object(
      'success', true,
      'type', 'graduation',
      'message', 'Student graduated successfully'
    );
  ELSE
    -- Regular promotion logic here
    -- (existing promotion code)
    v_result := json_build_object(
      'success', true,
      'type', 'promotion',
      'message', 'Student promoted successfully'
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. API Functions Needed

**src/api/alumni.api.js**:
- `getAlumniList()` - Get all graduated students
- `getLeftSchoolList()` - Get all students who left
- `getAlumniById(id)` - Get alumni details
- `updateAlumniInfo(id, data)` - Update alumni contact/occupation info
- `markStudentAsLeftSchool(studentId, data)` - Mark student as left school

### 7. UI Components

**Pages**:
- `src/pages/Students/AlumniPage.jsx` - Main alumni management page

**Components**:
- `src/components/shared/AlumniCard.jsx` - Display alumni information
- `src/components/shared/LeftSchoolCard.jsx` - Display left school student info
- `src/components/shared/UpdateAlumniInfoModal.jsx` - Update alumni contact details

### 8. Sidebar Navigation Update

Add new menu item:
```jsx
{
  name: 'Alumni',
  icon: '🎓',
  path: '/students/alumni',
  badge: alumniCount
}
```

## Implementation Steps

1. ✅ Create database schema (alumni_records, left_school_records)
2. ✅ Update students table status constraint
3. ✅ Create promotion function with graduation support
4. ✅ Create API functions for alumni management
5. ✅ Create Alumni page with tabs
6. ✅ Update promotion modal to detect graduation
7. ✅ Add sidebar navigation
8. ✅ Create "Mark as Left School" functionality
9. ✅ Add RLS policies for new tables
10. ✅ Test complete flow

## Benefits

- **Historical Records**: Keep complete student history
- **Alumni Network**: Track graduated students
- **Data Integrity**: Separate active from inactive students
- **Reporting**: Generate alumni reports and statistics
- **Contact Management**: Maintain alumni contact information