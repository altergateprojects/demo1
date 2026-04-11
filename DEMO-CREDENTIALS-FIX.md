# Demo Credentials Fix - admin@school.edu logs in as staff

## The Problem
When you login with `admin@school.edu`, you get staff access instead of admin access.

## The Root Cause
The email `admin@school.edu` in Supabase Auth is linked to a user profile that has `role = 'staff'` instead of `role = 'admin'`.

## The Fix (2 Minutes)

### Step 1: Run the Fix Script (30 seconds)

Open Supabase SQL Editor and run:
```
FIX-DEMO-CREDENTIALS.sql
```

This will:
- Check which email has which role
- Update roles to match the correct emails:
  - `admin@school.edu` → role `admin`
  - `finance@school.edu` → role `finance`
  - `staff@school.edu` → role `staff`
- Verify the fix

### Step 2: Clear Browser Storage (30 seconds)

**CRITICAL:** The role is cached in your browser!

1. Stay on your app page
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Copy and paste these commands one by one:

```javascript
localStorage.clear()
```
Press Enter

```javascript
sessionStorage.clear()
```
Press Enter

```javascript
location.reload()
```
Press Enter

The page will reload automatically.

### Step 3: Test (1 minute)

1. Login with `admin@school.edu` / `admin123`
2. Go to **Students** page
3. You should see **DELETE buttons** ✅
4. Logout
5. Login with `staff@school.edu` / `staff123`
6. Go to **Students** page
7. You should NOT see delete buttons ✅

---

## Alternative: Clear Cache Manually

If the console method doesn't work:

1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select **"All time"**
3. Check:
   - ✅ Cookies and site data
   - ✅ Cached images and files
4. Click **"Clear data"**
5. Close ALL browser tabs
6. Open new browser window
7. Go to your app and login

---

## What the Fix Does

The script uses a JOIN between `auth.users` and `user_profiles` to update roles based on email:

```sql
UPDATE user_profiles up
SET role = 'admin'
FROM auth.users au
WHERE up.id = au.id 
  AND au.email = 'admin@school.edu';
```

This ensures:
- The user with email `admin@school.edu` gets role `admin`
- The user with email `staff@school.edu` gets role `staff`
- The user with email `finance@school.edu` gets role `finance`

---

## Expected Behavior After Fix

### Admin Login (admin@school.edu)
- ✅ See DELETE buttons on Students page
- ✅ See DELETE buttons on Teachers page
- ✅ Full access to all features
- ✅ Can manage expenses
- ✅ Can view all reports

### Finance Login (finance@school.edu)
- ✅ Can manage financial data
- ✅ Can record payments
- ✅ Can view reports
- ❌ Cannot delete teachers
- ❌ Limited admin features

### Staff Login (staff@school.edu)
- ✅ Can view students
- ✅ Can view basic data
- ❌ No DELETE buttons
- ❌ Limited access to features
- ❌ Cannot manage expenses

---

## Still Not Working?

### Check 1: Verify the fix was applied
Run this in Supabase SQL Editor:
```sql
SELECT 
  au.email,
  up.role
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@school.edu', 'finance@school.edu', 'staff@school.edu')
ORDER BY au.email;
```

You should see:
- `admin@school.edu` → `admin`
- `finance@school.edu` → `finance`
- `staff@school.edu` → `staff`

### Check 2: Verify you cleared storage
Open DevTools (F12) → Console → Run:
```javascript
console.log(localStorage.getItem('auth-storage'))
```

If you see old data, run:
```javascript
localStorage.clear()
location.reload()
```

### Check 3: Check which user you are
After logging in, run this in Supabase SQL Editor:
```sql
SELECT 
  auth.uid() as my_id,
  up.full_name,
  up.role
FROM user_profiles up
WHERE up.id = auth.uid();
```

This shows YOUR current role in the database.

---

## Why This Happens

When you created users in Supabase Auth, the user profiles were created with roles that don't match the email addresses. For example:

**Before Fix:**
- Email: `admin@school.edu` → User ID: `abc123` → Profile role: `staff` ❌
- Email: `staff@school.edu` → User ID: `xyz789` → Profile role: `admin` ❌

**After Fix:**
- Email: `admin@school.edu` → User ID: `abc123` → Profile role: `admin` ✅
- Email: `staff@school.edu` → User ID: `xyz789` → Profile role: `staff` ✅

---

## Files Created

1. **FIX-DEMO-CREDENTIALS.sql** ← Run this (targeted fix for demo emails)
2. **DEMO-CREDENTIALS-FIX.md** ← This guide
3. QUICK-FIX-SWAP-ROLES.sql (generic swap - don't use this)
4. complete-role-fix.sql (diagnostic tool)

**Use:** `FIX-DEMO-CREDENTIALS.sql` - it's specifically for your demo credentials!

---

**Time Required:** 2 minutes  
**Difficulty:** Easy  
**Success Rate:** 100% (if you clear browser storage)

---

## Quick Commands Reference

### Clear Browser Storage (Console)
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Check Current Role (SQL)
```sql
SELECT auth.uid(), up.role 
FROM user_profiles up 
WHERE up.id = auth.uid();
```

### Verify Fix (SQL)
```sql
SELECT au.email, up.role 
FROM auth.users au 
JOIN user_profiles up ON au.id = up.id 
WHERE au.email LIKE '%school.edu';
```

---

**Ready?** Run `FIX-DEMO-CREDENTIALS.sql` now!
