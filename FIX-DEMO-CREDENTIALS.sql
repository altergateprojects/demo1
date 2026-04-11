-- Fix Demo Credentials Role Mismatch
-- This fixes the issue where admin@school.edu logs in as staff

-- Demo credentials from LoginPage.jsx:
-- admin@school.edu → Should have role 'admin'
-- finance@school.edu → Should have role 'finance'
-- staff@school.edu → Should have role 'staff'

-- ============================================
-- STEP 1: Check current mapping
-- ============================================
-- This shows which email has which role
SELECT 
  au.email,
  up.full_name,
  up.role as current_role,
  CASE 
    WHEN au.email = 'admin@school.edu' AND up.role != 'admin' THEN '❌ WRONG - Should be admin'
    WHEN au.email = 'finance@school.edu' AND up.role != 'finance' THEN '❌ WRONG - Should be finance'
    WHEN au.email = 'staff@school.edu' AND up.role != 'staff' THEN '❌ WRONG - Should be staff'
    ELSE '✅ CORRECT'
  END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@school.edu', 'finance@school.edu', 'staff@school.edu')
ORDER BY au.email;

-- ============================================
-- STEP 2: THE FIX
-- ============================================
-- This updates the roles based on the email addresses

-- Update admin user
UPDATE user_profiles up
SET role = 'admin'
FROM auth.users au
WHERE up.id = au.id 
  AND au.email = 'admin@school.edu';

-- Update finance user
UPDATE user_profiles up
SET role = 'finance'
FROM auth.users au
WHERE up.id = au.id 
  AND au.email = 'finance@school.edu';

-- Update staff user
UPDATE user_profiles up
SET role = 'staff'
FROM auth.users au
WHERE up.id = au.id 
  AND au.email = 'staff@school.edu';

-- ============================================
-- STEP 3: Verify the fix
-- ============================================
SELECT 
  au.email,
  up.full_name,
  up.role,
  CASE 
    WHEN au.email = 'admin@school.edu' AND up.role = 'admin' THEN '✅ CORRECT'
    WHEN au.email = 'finance@school.edu' AND up.role = 'finance' THEN '✅ CORRECT'
    WHEN au.email = 'staff@school.edu' AND up.role = 'staff' THEN '✅ CORRECT'
    ELSE '❌ STILL WRONG'
  END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@school.edu', 'finance@school.edu', 'staff@school.edu')
ORDER BY 
  CASE au.email
    WHEN 'admin@school.edu' THEN 1
    WHEN 'finance@school.edu' THEN 2
    WHEN 'staff@school.edu' THEN 3
  END;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Demo Credentials Fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email → Role Mapping:';
  RAISE NOTICE '   admin@school.edu → admin';
  RAISE NOTICE '   finance@school.edu → finance';
  RAISE NOTICE '   staff@school.edu → staff';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CRITICAL NEXT STEPS:';
  RAISE NOTICE '1. LOGOUT from your application';
  RAISE NOTICE '2. Open browser DevTools (F12)';
  RAISE NOTICE '3. Go to Console tab';
  RAISE NOTICE '4. Run: localStorage.clear()';
  RAISE NOTICE '5. Run: sessionStorage.clear()';
  RAISE NOTICE '6. Run: location.reload()';
  RAISE NOTICE '7. LOGIN with admin@school.edu';
  RAISE NOTICE '8. Check for DELETE buttons (admin feature)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Testing:';
  RAISE NOTICE '   admin@school.edu → Should see DELETE buttons';
  RAISE NOTICE '   staff@school.edu → Should NOT see DELETE buttons';
  RAISE NOTICE '';
END $$;
