-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "users_read_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin_read_all_profiles" ON user_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_update_profiles" ON user_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- School profile policies
CREATE POLICY "all_read_school_profile" ON school_profile FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_update_school_profile" ON school_profile FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Academic years policies
CREATE POLICY "all_read_academic_years" ON academic_years FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_manage_academic_years" ON academic_years FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Standards policies
CREATE POLICY "all_read_standards" ON standards FOR SELECT TO authenticated USING (TRUE);

-- Fee configurations policies
CREATE POLICY "finance_admin_read_fee_configs" ON fee_configurations FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);
CREATE POLICY "admin_manage_fee_configs" ON fee_configurations FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Students policies
CREATE POLICY "auth_read_students" ON students FOR SELECT TO authenticated USING (is_deleted = FALSE);
CREATE POLICY "finance_admin_staff_insert_students" ON students FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance','staff'))
);
CREATE POLICY "finance_admin_update_students" ON students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);
CREATE POLICY "admin_delete_students" ON students FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Fee payments policies
CREATE POLICY "finance_admin_all_fee_payments" ON fee_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);

-- Teachers policies
CREATE POLICY "all_read_teachers_basic" ON teachers FOR SELECT TO authenticated USING (is_deleted = FALSE);
CREATE POLICY "finance_admin_insert_teachers" ON teachers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);
CREATE POLICY "finance_admin_update_teachers" ON teachers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);

-- Expenses policies
CREATE POLICY "finance_admin_expenses" ON expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);

-- Audit logs policies
CREATE POLICY "finance_admin_read_audit" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);
CREATE POLICY "system_insert_audit" ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- System alerts policies
CREATE POLICY "all_read_alerts" ON system_alerts FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_finance_manage_alerts" ON system_alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','finance'))
);