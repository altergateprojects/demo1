-- Update teachers table to include additional fields

-- Add new columns to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add check constraint for experience_years
ALTER TABLE teachers 
ADD CONSTRAINT teachers_experience_years_check 
CHECK (experience_years >= 0);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers (status);
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers (subject);
CREATE INDEX IF NOT EXISTS idx_teachers_created_at ON teachers (created_at);

-- Enable RLS if not already enabled
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teachers
DROP POLICY IF EXISTS "authenticated_read_teachers" ON teachers;
CREATE POLICY "authenticated_read_teachers" ON teachers 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_teachers" ON teachers;
CREATE POLICY "admin_manage_teachers" ON teachers 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin')
    )
  );

-- Add updated_at trigger if not exists
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at 
  BEFORE UPDATE ON teachers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the schema
SELECT 'Teachers table updated successfully!' as status;

-- Show current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teachers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;