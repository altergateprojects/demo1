-- Swap User Names to Match Their Roles
-- This makes the names match the roles for clarity

-- Current state (confusing):
-- admin@school.edu → "School Staff" (but has admin role)
-- staff@school.edu → "School Administrator" (but has staff role)

-- After fix:
-- admin@school.edu → "School Administrator" (admin role)
-- staff@school.edu → "School Staff" (staff role)

-- Show current state
SELECT 
  '=== BEFORE NAME SWAP ===' as status,
  au.email,
  up.full_name,
  up.role
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@school.edu', 'staff@school.edu')
ORDER BY au.email;

-- Swap the names
UPDATE user_profiles up
SET full_name = CASE 
  WHEN up.full_name = 'School Staff' THEN 'School Administrator'
  WHEN up.full_name = 'School Administrator' THEN 'School Staff'
  ELSE up.full_name
END
FROM auth.users au
WHERE up.id = au.id 
  AND au.email IN ('admin@school.edu', 'staff@school.edu');

-- Show new state
SELECT 
  '=== AFTER NAME SWAP ===' as status,
  au.email,
  up.full_name,
  up.role,
  CASE 
    WHEN au.email = 'admin@school.edu' AND up.full_name = 'School Administrator' THEN '✅ CORRECT'
    WHEN au.email = 'staff@school.edu' AND up.full_name = 'School Staff' THEN '✅ CORRECT'
    ELSE '❌ STILL WRONG'
  END as status_check
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@school.edu', 'staff@school.edu')
ORDER BY au.email;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ User Names Swapped!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email → Name → Role:';
  RAISE NOTICE '   admin@school.edu → School Administrator → admin';
  RAISE NOTICE '   staff@school.edu → School Staff → staff';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Now the names match the roles!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '1. Clear browser storage (F12 → Console)';
  RAISE NOTICE '2. Run: localStorage.clear()';
  RAISE NOTICE '3. Run: location.reload()';
  RAISE NOTICE '4. Login and test';
  RAISE NOTICE '';
END $$;
