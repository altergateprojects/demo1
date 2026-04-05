-- 🤖 SETUP AUTO-PROFILE CREATION
-- This enables automatic user profile creation

-- Step 1: Create the auto-profile function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically create a user profile when a new user signs up
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
        'staff'  -- Default role for new users
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;

-- Step 4: Show existing users who need profiles
SELECT 
    '=== USERS WITHOUT PROFILES ===' as info;

SELECT 
    au.id,
    au.email,
    au.created_at,
    'Run the next script to add profile' as action
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

SELECT 
    '✅ AUTO-PROFILE CREATION IS NOW ENABLED!' as status,
    'New users will automatically get profiles when they sign up' as message,
    'Run add-profile-for-existing-users.sql to fix existing users' as next_step;