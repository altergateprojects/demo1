# Fix: User Role Mismatch Issue

## Problem
- Admin credentials login as staff
- Staff credentials login as admin
- Roles are swapped or incorrect

## Root Cause
The `user_profiles` table has incorrect role assignments for users. The user ID in `user_profiles` might not match the correct user in `auth.users`, or the roles are simply wrong.

---

## Quick Fix (5 minutes)

### Step 1: Run the Complete Fix Script

Open `complete-role-fix.sql` in Supabase SQL Editor and run it. This will:
- Show you current user_profiles
- Show you auth.users (if accessible)
- Show the mapping between them
- Provide fix options

### Step 2: Identify the Issue

Look at the results. You'll see which user ID has which role.

**Common Issue:** The email you think is "admin" is actually assigned to the user with "staff" role in user_profiles.

### Step 3: Choose Your Fix

The script provides 3 options:

**OPTION A: Swap admin and staff roles** (Most common fix)
```sql
-- This swaps the roles between admin and staff users
UPDATE user_profiles 
SET role = CASE 
  WHEN role = 'admin' THEN 'staff'
  WHEN role = 'staff' THEN 'admin'
  ELSE role
END
WHERE role IN ('admin', 'staff');
```

**OPTION B: Set by name**
```sql
UPDATE user_profiles SET role = 'admin' WHERE full_name = 'School Administrator';
UPDATE user_profiles SET role = 'staff' WHERE full_name = 'School Staff';
```

**OPTION C: Set by ID** (if you know the exact IDs)
```sql
UPDATE user_profiles SET role = 'admin' WHERE id = 'your-admin-user-id';
UPDATE user_profiles SET role = 'staff' WHERE id = 'your-staff-user-id';
```

### Step 4: Apply the Fix

Run ONE of the options from Step 3 in Supabase SQL Editor.

### Step 5: CRITICAL - Clear Browser Cache

This is the most important step! The role is cached in your browser.

1. Logout from the application
2. Press **Ctrl+Shift+Delete** (Windows/Linux) or **Cmd+Shift+Delete** (Mac)
3. Select "All time" or "Everything"
4. Check "Cached images and files" and "Cookies and site data"
5. Click "Clear data"
6. Close ALL browser tabs
7. Open a new browser window

### Step 6: Test the Fix

1. Open your application in a new tab
2. Login with admin credentials
3. Check if you see admin features (Delete buttons, full access)
4. Logout
5. Login with staff credentials
6. Check if you see limited features (no delete buttons)

---

## Detailed Diagnosis

### Run the Diagnostic Script

1. Open Supabase SQL Editor
2. Run the file: `fix-user-role-mismatch.sql`
3. Review all query results
4. Identify the issue

### Common Issues

**Issue 1: User ID Mismatch**
```
Problem: user_profiles.id doesn't match auth.users.id
Solution: Delete wrong profile, create new one with correct ID
```

**Issue 2: Duplicate Profiles**
```
Problem: Multiple profiles for same email
Solution: Delete duplicates, keep only one
```

**Issue 3: Wrong Role Assignment**
```
Problem: Admin has role='staff', Staff has role='admin'
Solution: Update roles with correct values
```

**Issue 4: Missing Profile**
```
Problem: User exists in auth.users but not in user_profiles
Solution: Create profile with correct role
```

---

## Step-by-Step Fix Example

### Scenario: Admin and Staff roles are swapped

**Current State:**
- admin@school.com has role='staff' ❌
- staff@school.com has role='admin' ❌

**Fix:**

```sql
-- Step 1: Check current state
SELECT email, role FROM user_profiles;

-- Step 2: Swap the roles
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@school.com';

UPDATE user_profiles
SET role = 'staff'
WHERE email = 'staff@school.com';

-- Step 3: Verify
SELECT email, role FROM user_profiles;
```

**Expected Result:**
- admin@school.com has role='admin' ✅
- staff@school.com has role='staff' ✅

---

## How to Get User IDs from Supabase

### Method 1: Supabase Dashboard
1. Go to Authentication → Users
2. Click on a user
3. Copy the "ID" field
4. This is the user ID you need

### Method 2: SQL Query
```sql
-- Get all auth users
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at;
```

---

## Complete Fix Script Template

```sql
-- 1. Check current state
SELECT 
  up.id,
  up.email,
  up.role,
  au.email as auth_email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id;

-- 2. Delete all profiles (if needed)
DELETE FROM user_profiles;

-- 3. Create correct profiles
-- Get user IDs from Supabase Auth dashboard first!

-- Admin profile
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES 
  ('PASTE-ADMIN-USER-ID-HERE', 'admin@school.com', 'Admin Name', 'admin', true);

-- Finance profile (optional)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES 
  ('PASTE-FINANCE-USER-ID-HERE', 'finance@school.com', 'Finance Name', 'finance', true);

-- Staff profile
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES 
  ('PASTE-STAFF-USER-ID-HERE', 'staff@school.com', 'Staff Name', 'staff', true);

-- 4. Verify
SELECT 
  id,
  email,
  full_name,
  role
FROM user_profiles
ORDER BY role;
```

---

## Testing After Fix

### Test Admin Login
1. Login with admin credentials
2. Go to Students page
3. Try to delete a student
4. **Expected:** Delete button visible ✅
5. Go to Teachers page
6. Try to delete a teacher
7. **Expected:** Delete button visible ✅

### Test Staff Login
1. Login with staff credentials
2. Go to Students page
3. Look for delete button
4. **Expected:** Delete button NOT visible ✅
5. Try to access Expenses page
6. **Expected:** Limited or no access ✅

### Test Finance Login (if you have one)
1. Login with finance credentials
2. Go to Students page
3. **Expected:** Can see financial data ✅
4. **Expected:** Cannot delete teachers ✅

---

## Prevention

### Always Create Profiles Correctly

When creating a new user:

1. **First:** Create user in Supabase Auth
2. **Second:** Get the user ID
3. **Third:** Create profile with correct role

```sql
-- Template for new user profile
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES 
  ('user-id-from-auth', 'user@email.com', 'Full Name', 'staff', true);
```

### Role Options
- `'admin'` - Full access to everything
- `'finance'` - Financial operations, cannot delete teachers
- `'staff'` - Limited access, view-only mostly

---

## Troubleshooting

### Issue: Still seeing wrong role after fix
**Solution:**
1. Logout completely
2. Clear browser cache
3. Close all browser tabs
4. Open new tab
5. Login again

### Issue: "Profile not found" error
**Solution:**
```sql
-- Check if profile exists
SELECT * FROM user_profiles WHERE email = 'your@email.com';

-- If not found, create it
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES 
  ('user-id-from-auth', 'your@email.com', 'Your Name', 'admin', true);
```

### Issue: Multiple profiles for same user
**Solution:**
```sql
-- Find duplicates
SELECT email, COUNT(*) 
FROM user_profiles 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Delete wrong ones (keep the one with correct ID)
DELETE FROM user_profiles 
WHERE id = 'wrong-profile-id';
```

---

## Quick Reference

### Check Roles
```sql
SELECT email, role FROM user_profiles;
```

### Update Role
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'user@email.com';
```

### Create Profile
```sql
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES ('user-id', 'email', 'name', 'admin', true);
```

### Delete Profile
```sql
DELETE FROM user_profiles WHERE email = 'user@email.com';
```

---

## Need Help?

1. Run `fix-user-role-mismatch.sql` for diagnosis
2. Check all query results
3. Identify the specific issue
4. Apply the appropriate fix
5. Test thoroughly

**Remember:** Always backup your database before making changes!

---

**Status:** Ready to fix  
**Time Required:** 5-10 minutes  
**Difficulty:** Easy  
**Risk:** Low (can be reversed)
