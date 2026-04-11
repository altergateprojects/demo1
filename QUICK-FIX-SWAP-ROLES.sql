-- QUICK FIX: Swap Admin and Staff Roles
-- Run this if admin credentials login as staff and vice versa

-- Show current state
SELECT 
  '=== BEFORE FIX ===' as status,
  id,
  full_name,
  role
FROM user_profiles
ORDER BY role;

-- Swap the roles
UPDATE user_profiles 
SET role = CASE 
  WHEN role = 'admin' THEN 'staff'
  WHEN role = 'staff' THEN 'admin'
  ELSE role
END
WHERE role IN ('admin', 'staff');

-- Show new state
SELECT 
  '=== AFTER FIX ===' as status,
  id,
  full_name,
  role
FROM user_profiles
ORDER BY role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Roles Swapped Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CRITICAL NEXT STEPS:';
  RAISE NOTICE '1. LOGOUT from your application';
  RAISE NOTICE '2. CLEAR browser cache (Ctrl+Shift+Delete)';
  RAISE NOTICE '3. Select "All time" and clear everything';
  RAISE NOTICE '4. CLOSE all browser tabs';
  RAISE NOTICE '5. OPEN new browser window';
  RAISE NOTICE '6. LOGIN again and test';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Testing:';
  RAISE NOTICE '   - Admin login should show DELETE buttons';
  RAISE NOTICE '   - Staff login should NOT show DELETE buttons';
  RAISE NOTICE '';
END $$;
