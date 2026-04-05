-- This file contains demo data for testing
-- In production, users would be created via Supabase Auth

-- Note: This is just for reference. In a real app, you would:
-- 1. Create users via supabase.auth.signUp() or admin.createUser()
-- 2. Then insert corresponding user_profiles records

-- Demo user profiles (assuming users exist in auth.users)
-- These would be created after the auth users are created

-- Example of how to create demo users programmatically:
/*
-- Admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@school.edu',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO user_profiles (id, full_name, role, phone, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'School Administrator',
  'admin',
  '+91 98765 43210',
  true
);

-- Finance user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'finance@school.edu',
  crypt('finance123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO user_profiles (id, full_name, role, phone, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Finance Manager',
  'finance',
  '+91 87654 32109',
  true
);

-- Staff user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'staff@school.edu',
  crypt('staff123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO user_profiles (id, full_name, role, phone, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'School Staff',
  'staff',
  '+91 76543 21098',
  true
);
*/

-- Update school profile with demo data
UPDATE school_profile SET
  school_name = 'Bright Future School',
  address = '123 Education Street',
  city = 'Mumbai',
  district = 'Mumbai',
  state = 'Maharashtra',
  pin_code = '400001',
  phone = '+91 22 1234 5678',
  email = 'info@brightfuture.edu.in',
  board_affiliation = 'CBSE',
  udise_code = '27010101234',
  trust_name = 'Bright Future Educational Trust'
WHERE id = 1;