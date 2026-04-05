-- 👤 ADD PROFILES FOR EXISTING USERS
-- This creates profiles for users who already exist

-- Create profiles for all existing users who don't have one
INSERT INTO user_profiles (id, full_name, role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
    'staff'  -- Default role, change to 'admin' for specific users below
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Make the first user an admin (usually you!)
UPDATE user_profiles 
SET role = 'admin'
WHERE id = (
    SELECT id FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Show all user profiles
SELECT 
    '=== ALL USER PROFILES ===' as info;

SELECT 
    up.id,
    up.full_name,
    up.role,
    au.email,
    up.created_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at;

SELECT 
    '✅ PROFILES CREATED!' as status,
    'All existing users now have profiles' as message,
    'The first user has been made admin' as note;