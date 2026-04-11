-- Complete Role Mismatch Fix
-- This will help identify and fix the role assignment issue

-- ============================================
-- STEP 1: Check what we have in user_profiles
-- ============================================
SELECT 
  id,
  full_name,
  role,
  created_at
FROM user_profiles
ORDER BY created_at;

-- ============================================
-- STEP 2: Check auth.users (requires service_role or RLS bypass)
-- ============================================
-- This might not work if you don't have service_role access
-- But try it anyway
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at;

-- ============================================
-- STEP 3: Join to see the mapping
-- ============================================
SELECT 
  au.id,
  au.email,
  up.full_name,
  up.role,
  CASE 
    WHEN up.role = 'admin' THEN '✓ ADMIN'
    WHEN up.role = 'staff' THEN '✓ STAFF'
    WHEN up.role = 'finance' THEN '✓ FINANCE'
    ELSE '? UNKNOWN'
  END as role_label
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at;

-- ============================================
-- STEP 4: THE FIX - Based on your screenshot
-- ============================================
-- From your screenshot, we have:
-- ID: 77467278-769c-45bc-8411-09f56e59d40 | Name: School Staff | Role: staff
-- ID: d7a8060f-77ae-4a8b-82f5-3493ef424d8d | Name: School Administrator | Role: admin
-- ID: eb0d6c33-85ac-47a8-85f3-3b981dd4d408 | Name: Finance Manager | Role: finance

-- The roles LOOK correct, but if you're experiencing swapped behavior,
-- it means the email addresses in auth.users don't match what you expect.

-- OPTION A: If you want to swap admin and staff roles
-- (Run this ONLY if admin login shows staff features)
DO $$
BEGIN
  -- Swap the roles
  UPDATE user_profiles 
  SET role = CASE 
    WHEN role = 'admin' THEN 'staff'
    WHEN role = 'staff' THEN 'admin'
    ELSE role
  END
  WHERE role IN ('admin', 'staff');
  
  RAISE NOTICE '✓ Roles swapped between admin and staff';
END $$;

-- OPTION B: Set specific roles by full_name
-- (Uncomment and modify if needed)
/*
UPDATE user_profiles SET role = 'admin' WHERE full_name = 'School Administrator';
UPDATE user_profiles SET role = 'staff' WHERE full_name = 'School Staff';
UPDATE user_profiles SET role = 'finance' WHERE full_name = 'Finance Manager';
*/

-- OPTION C: Set specific roles by ID
-- (Uncomment and modify if needed)
/*
UPDATE user_profiles SET role = 'admin' WHERE id = 'd7a8060f-77ae-4a8b-82f5-3493ef424d8d';
UPDATE user_profiles SET role = 'staff' WHERE id = '77467278-769c-45bc-8411-09f56e59d40';
UPDATE user_profiles SET role = 'finance' WHERE id = 'eb0d6c33-85ac-47a8-85f3-3b981dd4d408';
*/

-- ============================================
-- STEP 5: Verify the fix
-- ============================================
SELECT 
  id,
  full_name,
  role,
  CASE 
    WHEN role = 'admin' THEN '👑 Administrator (Full Access)'
    WHEN role = 'staff' THEN '👤 Staff (Limited Access)'
    WHEN role = 'finance' THEN '💰 Finance (Financial Access)'
    ELSE '❓ Unknown Role'
  END as role_description
FROM user_profiles
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'finance' THEN 2
    WHEN 'staff' THEN 3
    ELSE 4
  END;

-- ============================================
-- STEP 6: Test which user you are
-- ============================================
-- Run this AFTER logging in to see your current role
SELECT 
  auth.uid() as my_user_id,
  up.full_name as my_name,
  up.role as my_role,
  CASE 
    WHEN up.role = 'admin' THEN '👑 You have ADMIN access'
    WHEN up.role = 'staff' THEN '👤 You have STAFF access'
    WHEN up.role = 'finance' THEN '💰 You have FINANCE access'
    ELSE '❓ Unknown role'
  END as access_level
FROM user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Run STEP 1 to see current user_profiles
-- 2. Try STEP 2 to see auth.users (might fail if no access)
-- 3. Try STEP 3 to see the mapping
-- 4. Choose ONE option from STEP 4 (A, B, or C)
-- 5. Run STEP 5 to verify
-- 6. LOGOUT from your app
-- 7. CLEAR browser cache (Ctrl+Shift+Delete)
-- 8. LOGIN again
-- 9. Run STEP 6 to confirm your role
-- 10. Test the features

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- If roles are still swapped after running this:
-- 1. The issue is with which email you're using to login
-- 2. Check Supabase Dashboard → Authentication → Users
-- 3. Note which email has which user ID
-- 4. Update user_profiles to match the correct mapping

-- Example: If admin@school.edu has ID xxx and you want it to be admin:
-- UPDATE user_profiles SET role = 'admin' WHERE id = 'xxx';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Role Fix Script Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '1. Review the query results above';
  RAISE NOTICE '2. Choose and run ONE fix option (A, B, or C)';
  RAISE NOTICE '3. Logout from the application';
  RAISE NOTICE '4. Clear browser cache completely';
  RAISE NOTICE '5. Login again and test';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT:';
  RAISE NOTICE '   After running the fix, you MUST clear browser cache!';
  RAISE NOTICE '   The role is cached in localStorage';
  RAISE NOTICE '';
END $$;
