-- 👤 ADD USER PROFILE
-- This script helps you add your user profile to the system

-- STEP 1: Get your current user ID
SELECT 
    '=== YOUR USER INFORMATION ===' as info,
    auth.uid() as your_user_id,
    auth.email() as your_email;

-- STEP 2: Check if you already have a profile
SELECT 
    '=== EXISTING PROFILE CHECK ===' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) 
        THEN 'You already have a profile!' 
        ELSE 'No profile found - we will create one'
    END as profile_status;

-- STEP 3: Add your profile (modify the details as needed)
INSERT INTO user_profiles (id, full_name, email, role, phone, is_active)
VALUES (
    auth.uid(),                    -- Your user ID from Supabase Auth
    'School Administrator',        -- 👈 CHANGE THIS to your name
    COALESCE(auth.email(), 'admin@school.com'),  -- Uses your auth email or default
    'admin',                       -- 👈 CHANGE THIS if needed (admin/finance/staff/teacher)
    '+91-9876543210',             -- 👈 CHANGE THIS to your phone number
    true
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- STEP 4: Verify your profile was created
SELECT 
    '=== YOUR PROFILE ===' as info,
    id,
    full_name,
    email,
    role,
    phone,
    is_active,
    created_at
FROM user_profiles 
WHERE id = auth.uid();

-- STEP 5: Update fee configurations to have a created_by user
UPDATE fee_configurations 
SET created_by = auth.uid()
WHERE created_by IS NULL;

-- STEP 6: Update students to have a created_by user  
UPDATE students 
SET created_by = auth.uid()
WHERE created_by IS NULL;

-- Success message
SELECT 
    '✅ USER PROFILE SETUP COMPLETE!' as status,
    'You now have full access to the application.' as message,
    'Refresh your browser to see the changes.' as next_step;