# Role Mismatch - Simple Fix (2 Minutes)

## The Problem
- Admin credentials login as staff ❌
- Staff credentials login as admin ❌

## The Solution (3 Steps)

### Step 1: Run the Fix (30 seconds)

Open Supabase SQL Editor and run this file:
```
QUICK-FIX-SWAP-ROLES.sql
```

This will swap the admin and staff roles.

### Step 2: Clear Browser Cache (1 minute)

**CRITICAL:** You MUST clear your browser cache!

1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select **"All time"** or **"Everything"**
3. Check these boxes:
   - ✅ Cached images and files
   - ✅ Cookies and site data
   - ✅ Hosted app data (if available)
4. Click **"Clear data"**
5. **Close ALL browser tabs**
6. **Open a NEW browser window**

### Step 3: Test (30 seconds)

1. Login with admin credentials
2. Go to Students page
3. You should see **DELETE buttons** ✅
4. Logout
5. Login with staff credentials
6. Go to Students page
7. You should NOT see delete buttons ✅

---

## Why This Happens

The `user_profiles` table stores which user ID has which role. When you created the users, the roles were assigned to the wrong user IDs.

**Example:**
- User ID `abc123` (email: admin@school.edu) → Has role `staff` ❌
- User ID `xyz789` (email: staff@school.edu) → Has role `admin` ❌

The fix swaps these roles so:
- User ID `abc123` (email: admin@school.edu) → Has role `admin` ✅
- User ID `xyz789` (email: staff@school.edu) → Has role `staff` ✅

---

## Still Not Working?

If it's still not working after clearing cache:

### Check 1: Verify the roles were swapped
```sql
SELECT id, full_name, role FROM user_profiles ORDER BY role;
```

You should see:
- Someone with role = `admin`
- Someone with role = `staff`

### Check 2: Check which user you are
Login to your app, then run this in Supabase:
```sql
SELECT 
  auth.uid() as my_id,
  up.full_name,
  up.role
FROM user_profiles up
WHERE up.id = auth.uid();
```

This shows YOUR current role.

### Check 3: Clear localStorage manually
Open browser console (F12) and run:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## Prevention

When creating new users in the future:

1. Create user in Supabase Auth
2. Note the user ID
3. Create profile with correct role:
```sql
INSERT INTO user_profiles (id, full_name, role, is_active)
VALUES ('user-id-from-auth', 'User Name', 'admin', true);
```

---

## Quick Reference

### Admin Features (should see):
- ✅ Delete buttons on Students page
- ✅ Delete buttons on Teachers page
- ✅ Full access to all features

### Staff Features (should NOT see):
- ❌ No delete buttons
- ❌ Limited access to some features

---

**Time Required:** 2 minutes  
**Difficulty:** Easy  
**Risk:** None (can be reversed by running the script again)

---

## Files Created

1. `QUICK-FIX-SWAP-ROLES.sql` - One-click fix script
2. `complete-role-fix.sql` - Comprehensive diagnostic script
3. `ROLE_MISMATCH_SIMPLE_FIX.md` - This guide
4. `FIX_ROLE_MISMATCH.md` - Detailed guide

**Start with:** `QUICK-FIX-SWAP-ROLES.sql`
