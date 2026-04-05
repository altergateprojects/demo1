# Quick Setup Guide - Fix Login Issue

## The Problem
Your login is failing because:
1. The Supabase anon key might be incorrect
2. The database tables don't exist yet
3. No demo users have been created

## Quick Fix Steps

### Step 1: Get Correct Anon Key
1. Go to: https://supabase.com/dashboard/project/vakwehszjbnytpltwbhr
2. Click "Settings" → "API"
3. Copy the "anon public" key (NOT the secret key)
4. Replace `VITE_SUPABASE_ANON_KEY` in `.env.local`

### Step 2: Set Up Database
1. In your Supabase dashboard, go to "SQL Editor"
2. Copy and paste the entire content from `supabase/migrations/001_initial_schema.sql`
3. Click "Run" to create all tables

### Step 3: Set Up Security Policies
1. In SQL Editor, copy and paste content from `supabase/migrations/002_rls_policies.sql`
2. Click "Run"

### Step 4: Set Up Triggers
1. In SQL Editor, copy and paste content from `supabase/migrations/003_triggers.sql`
2. Click "Run"

### Step 5: Add Sample Data
1. In SQL Editor, copy and paste content from `supabase/migrations/004_seed_data.sql`
2. Click "Run"

### Step 6: Create Demo Users
1. Go to "Authentication" → "Users" in Supabase dashboard
2. Click "Add user" and create these users:

**Admin User:**
- Email: `admin@school.edu`
- Password: `admin123`

**Finance User:**
- Email: `finance@school.edu`
- Password: `finance123`

**Staff User:**
- Email: `staff@school.edu`
- Password: `staff123`

### Step 7: Link Users to Profiles
After creating each user, you need to link them to profiles:

1. Go to "SQL Editor"
2. For each user, run this SQL (replace `USER_ID` with actual ID from auth.users table):

```sql
-- For admin user
INSERT INTO user_profiles (id, full_name, role, phone, is_active)
VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',
  'School Administrator',
  'admin',
  '+91 98765 43210',
  true
);

-- For finance user
INSERT INTO user_profiles (id, full_name, role, phone, is_active)
VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',
  'Finance Manager',
  'finance',
  '+91 87654 32109',
  true
);

-- For staff user
INSERT INTO user_profiles (id, full_name, role, phone, is_active)
VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',
  'School Staff',
  'staff',
  '+91 76543 21098',
  true
);
```

### Step 8: Test Login
1. Your app should be running at http://localhost:3000
2. Try logging in with: `admin@school.edu` / `admin123`

## If Still Not Working

Check browser console (F12) for error messages and let me know what you see.

The most common issues are:
- Wrong anon key format
- Database tables not created
- Users not properly linked to profiles