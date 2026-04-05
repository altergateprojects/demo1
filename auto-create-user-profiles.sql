-- 🤖 AUTO-CREATE USER PROFILES
-- This creates user profiles automatically when users sign up

-- Step 1: Create the function that will auto-create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically create a user profile when a new user signs up
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
        'staff'  -- Default role, can be changed by admin later
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create profile for your current user (one-time fix)
INSERT INTO user_profiles (id, full_name, role)
VALUES (
    auth.uid(),
    COALESCE(auth.email(), 'Admin User'),
    'admin'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',  -- Make sure you're admin
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name);

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;

-- Step 5: Verify it worked
SELECT 
    '✅ AUTO-PROFILE CREATION ENABLED!' as status,
    'New users will automatically get profiles when they sign up' as message;

SELECT 
    'Your profile:' as info,
    id,
    full_name,
    role,
    created_at
FROM user_profiles 
WHERE id = auth.uid();

SELECT 
    '📝 To change a user role to admin, run:' as tip,
    'UPDATE user_profiles SET role = ''admin'' WHERE id = ''USER_ID_HERE'';' as command;