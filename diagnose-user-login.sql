-- Diagnose User Login Issue
-- This will help identify which user credentials map to which roles

-- Step 1: Check user_profiles table
SELECT 
  id,
  full_name,
  role,
  created_at
FROM user_profiles
ORDER BY created_at;

-- Step 2: Check auth.users table to see actual login emails
-- (This requires service_role access, may not work with anon key)
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  up.full_name,
  up.role
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at;

-- Step 3: If you can't access auth.users, check which user is currently logged in
SELECT 
  auth.uid() as current_user_id,
  up.full_name,
  up.role
FROM user_profiles up
WHERE up.id = auth.uid();

-- INSTRUCTIONS:
-- 1. Login with your ADMIN credentials
-- 2. Run Step 3 above
-- 3. Note the role it shows
-- 4. Logout
-- 5. Login with your STAFF credentials  
-- 6. Run Step 3 again
-- 7. Note the role it shows
-- 
-- If admin credentials show role='staff', then the issue is:
-- The user account you think is admin is actually assigned staff role in user_profiles
-- 
-- SOLUTION:
-- You need to identify which auth.users.email corresponds to which user_profiles.id
-- Then update the role in user_profiles to match what you expect
