-- Fix User Roles by User ID
-- Since there's no email column, we'll work with user IDs and full_name

-- Current state from your screenshot:
-- ID: 77467278-769c-45bc-8411-09f56e59d40 | Name: School Staff | Role: staff
-- ID: d7a8060f-77ae-4a8b-82f5-3493ef424d8d | Name: School Administrator | Role: admin  
-- ID: eb0d6c33-85ac-47a8-85f3-3b981dd4d408 | Name: Finance Manager | Role: finance

-- The roles LOOK correct based on the names!
-- But if you're experiencing swapped roles, it means:
-- The user account you're logging in with doesn't match what you think

-- OPTION 1: Swap the roles if they're actually reversed
-- (Only run this if you confirm admin login shows staff features)

-- Temporarily store roles
DO $$
DECLARE
  admin_id UUID := 'd7a8060f-77ae-4a8b-82f5-3493ef424d8d';
  staff_id UUID := '77467278-769c-45bc-8411-09f56e59d40';
BEGIN
  -- Swap roles
  UPDATE user_profiles SET role = 'admin' WHERE id = admin_id;
  UPDATE user_profiles SET role = 'staff' WHERE id = staff_id;
  
  RAISE NOTICE 'Roles updated!';
END $$;

-- OPTION 2: Set specific user to admin role
-- Replace the ID with the user ID that should be admin
-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE id = 'd7a8060f-77ae-4a8b-82f5-3493ef424d8d';

-- OPTION 3: Set specific user to staff role
-- Replace the ID with the user ID that should be staff
-- UPDATE user_profiles 
-- SET role = 'staff' 
-- WHERE id = '77467278-769c-45bc-8411-09f56e59d40';

-- Verify the changes
SELECT 
  id,
  full_name,
  role,
  created_at
FROM user_profiles
ORDER BY role;

-- IMPORTANT: After running this, you MUST:
-- 1. Logout from the application
-- 2. Clear browser cache (Ctrl+Shift+Delete)
-- 3. Close all browser tabs
-- 4. Open new tab and login again
-- 5. Test the roles
