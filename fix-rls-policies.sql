-- Fix RLS Policies - Run this in Supabase SQL Editor

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_read_own" ON user_profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON user_profiles;
DROP POLICY IF EXISTS "all_read_school_profile" ON school_profile;
DROP POLICY IF EXISTS "admin_update_school_profile" ON school_profile;
DROP POLICY IF EXISTS "all_read_academic_years" ON academic_years;
DROP POLICY IF EXISTS "admin_manage_academic_years" ON academic_years;
DROP POLICY IF EXISTS "all_read_standards" ON standards;
DROP POLICY IF EXISTS "finance_admin_read_fee_configs" ON fee_configurations;
DROP POLICY IF EXISTS "admin_manage_fee_configs" ON fee_configurations;
DROP POLICY IF EXISTS "auth_read_students" ON students;
DROP POLICY IF EXISTS "finance_admin_staff_insert_students" ON students;
DROP POLICY IF EXISTS "finance_admin_staff_update_students" ON students;
DROP POLICY IF EXISTS "auth_read_fee_payments" ON fee_payments;
DROP POLICY IF EXISTS "finance_admin_insert_fee_payments" ON fee_payments;
DROP POLICY IF EXISTS "admin_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "all_insert_audit_logs" ON audit_logs;

-- Create simple, working policies without circular references

-- User profiles - allow users to read their own profile
CREATE POLICY "users_can_read_own_profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);

-- User profiles - allow authenticated users to read all profiles (simplified for now)
CREATE POLICY "authenticated_can_read_profiles" ON user_profiles 
  FOR SELECT TO authenticated USING (true);

-- User profiles - allow updates (simplified)
CREATE POLICY "authenticated_can_update_profiles" ON user_profiles 
  FOR UPDATE TO authenticated USING (true);

-- School profile - allow all authenticated users to read
CREATE POLICY "authenticated_read_school_profile" ON school_profile 
  FOR SELECT TO authenticated USING (true);

-- School profile - allow updates
CREATE POLICY "authenticated_update_school_profile" ON school_profile 
  FOR UPDATE TO authenticated USING (true);

-- Academic years - allow all authenticated users to read
CREATE POLICY "authenticated_read_academic_years" ON academic_years 
  FOR SELECT TO authenticated USING (true);

-- Academic years - allow all operations for authenticated users
CREATE POLICY "authenticated_manage_academic_years" ON academic_years 
  FOR ALL TO authenticated USING (true);

-- Standards - allow all authenticated users to read
CREATE POLICY "authenticated_read_standards" ON standards 
  FOR SELECT TO authenticated USING (true);

-- Fee configurations - allow authenticated users to read
CREATE POLICY "authenticated_read_fee_configs" ON fee_configurations 
  FOR SELECT TO authenticated USING (true);

-- Fee configurations - allow all operations
CREATE POLICY "authenticated_manage_fee_configs" ON fee_configurations 
  FOR ALL TO authenticated USING (true);

-- Students - allow authenticated users to read active students
CREATE POLICY "authenticated_read_students" ON students 
  FOR SELECT TO authenticated USING (is_deleted = false);

-- Students - allow insert/update
CREATE POLICY "authenticated_manage_students" ON students 
  FOR ALL TO authenticated USING (true);

-- Fee payments - allow authenticated users to read
CREATE POLICY "authenticated_read_fee_payments" ON fee_payments 
  FOR SELECT TO authenticated USING (true);

-- Fee payments - allow insert
CREATE POLICY "authenticated_insert_fee_payments" ON fee_payments 
  FOR INSERT TO authenticated WITH CHECK (true);

-- Audit logs - allow authenticated users to read
CREATE POLICY "authenticated_read_audit_logs" ON audit_logs 
  FOR SELECT TO authenticated USING (true);

-- Audit logs - allow insert
CREATE POLICY "authenticated_insert_audit_logs" ON audit_logs 
  FOR INSERT TO authenticated WITH CHECK (true);