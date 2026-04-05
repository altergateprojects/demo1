-- 🔓 SIMPLE RLS FIX
-- Run this AFTER closing your application to avoid deadlocks

-- IMPORTANT: Close your browser/application first to avoid deadlocks!

-- Fix academic_years
DROP POLICY IF EXISTS "Allow all" ON academic_years;
CREATE POLICY "Allow all" ON academic_years FOR ALL USING (true);

-- Fix standards  
DROP POLICY IF EXISTS "Allow all" ON standards;
CREATE POLICY "Allow all" ON standards FOR ALL USING (true);

-- Fix user_profiles
DROP POLICY IF EXISTS "Allow all" ON user_profiles;
CREATE POLICY "Allow all" ON user_profiles FOR ALL USING (true);

-- Fix students
DROP POLICY IF EXISTS "Allow all" ON students;
CREATE POLICY "Allow all" ON students FOR ALL USING (true);

-- Fix fee_configurations
DROP POLICY IF EXISTS "Allow all" ON fee_configurations;
CREATE POLICY "Allow all" ON fee_configurations FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON standards TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT ALL ON fee_configurations TO authenticated;

SELECT '✅ RLS policies fixed! Now refresh your browser.' as status;