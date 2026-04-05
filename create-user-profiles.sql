-- STEP 1: First get the user IDs by running:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- STEP 2: Replace the UUIDs below with the actual ones from step 1
-- Then run this SQL:

INSERT INTO user_profiles (id, full_name, role, phone, is_active) VALUES
  ('REPLACE_WITH_ADMIN_UUID', 'School Administrator', 'admin', '+91 98765 43210', true),
  ('REPLACE_WITH_FINANCE_UUID', 'Finance Manager', 'finance', '+91 87654 32109', true),
  ('REPLACE_WITH_STAFF_UUID', 'School Staff', 'staff', '+91 76543 21098', true);

-- Example with real UUIDs (yours will be different):
-- INSERT INTO user_profiles (id, full_name, role, phone, is_active) VALUES
--   ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'School Administrator', 'admin', '+91 98765 43210', true),
--   ('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Finance Manager', 'finance', '+91 87654 32109', true),
--   ('c3d4e5f6-g7h8-9012-cdef-345678901234', 'School Staff', 'staff', '+91 76543 21098', true);