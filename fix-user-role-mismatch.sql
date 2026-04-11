-- Fix: User Role Mismatch Issue
-- Problem: Admin credentials login as staff, staff credentials login as admin

-- Step 1: Check current user profiles and their roles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  last_login_at
FROM user_profiles
ORDER BY created_at;

-- Step 2: Check Supabase Auth users
-- (You need to check this in Supabase Dashboard → Authentication → Users)
-- Compare the emails there with the user_profiles table

-- Step 3: Find mismatched roles
-- This will show if there are duplicate emails or wrong role assignments
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  au.email as auth_email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
ORDER BY up.email;

-- Step 4: Fix specific user roles (EXAMPLE - UPDATE WITH YOUR ACTUAL DATA)
-- Replace 'admin@school.com' with your actual admin email
-- Replace 'user-id-here' with the actual user ID from Supabase Auth

-- Example: Set admin role
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE email = 'admin@school.com';

-- Example: Set staff role
-- UPDATE user_profiles
-- SET role = 'staff'
-- WHERE email = 'staff@school.com';

-- Step 5: Verify the fix
SELECT 
  id,
  email,
  full_name,
  role
FROM user_profiles
ORDER BY role, email;

-- Step 6: Check for duplicate user profiles (this could cause the issue)
SELECT 
  email,
  COUNT(*) as count
FROM user_profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- If duplicates found, delete the wrong ones:
-- DELETE FROM user_profiles
-- WHERE id = 'wrong-user-id-here';

-- Step 7: Ensure user_profiles.id matches auth.users.id
-- This query will show any mismatches
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  up.id as profile_id,
  up.email as profile_email,
  up.role
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email IS NOT NULL;

-- Step 8: Create missing profiles (if any)
-- If a user exists in auth.users but not in user_profiles:
-- INSERT INTO user_profiles (id, email, full_name, role)
-- VALUES ('user-id-from-auth', 'email@example.com', 'Full Name', 'staff');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ User Role Diagnosis Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '1. Check the query results above';
  RAISE NOTICE '2. Identify which users have wrong roles';
  RAISE NOTICE '3. Update roles using UPDATE statements';
  RAISE NOTICE '4. Delete any duplicate profiles';
  RAISE NOTICE '5. Logout and login again to test';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Common Issues:';
  RAISE NOTICE '   - User ID mismatch between auth.users and user_profiles';
  RAISE NOTICE '   - Duplicate user profiles';
  RAISE NOTICE '   - Wrong role assigned in user_profiles';
  RAISE NOTICE '';
END $$;
