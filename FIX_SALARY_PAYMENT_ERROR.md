# Fix: "Could not find 'amount_paise' column" Error

## The Problem
```
Could not find the 'amount_paise' column of 'teacher_salary_payments' in the schema cache
```

This means the `teacher_salary_payments` table doesn't exist in your database yet.

## The Solution (3 Steps)

### Step 1: Run the SQL File
1. Open Supabase SQL Editor
2. Copy ALL content from `verify-and-create-salary-tables.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Wait for success message

### Step 2: Refresh Supabase Schema Cache
After running the SQL, Supabase needs to refresh its cache:

**Option A: Wait 30 seconds**
- Just wait 30 seconds for automatic refresh

**Option B: Force refresh (Faster)**
1. Go to Supabase Dashboard
2. Click "Table Editor" in sidebar
3. You should see `teacher_salary_payments` table
4. If not, refresh the page

### Step 3: Hard Refresh Your App
Clear the browser cache:
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

## Verify It Worked

After the steps above:
1. Go to `/salary` page
2. Click "Pay Salary" for any teacher
3. Fill in the form
4. Click "Record Payment"
5. Should work without errors!

## Why This Happens

The error occurs because:
1. The SQL file wasn't run yet, OR
2. Supabase's schema cache is outdated

Running the SQL creates the table, and refreshing updates the cache.

## Alternative: Check if Table Exists

Run this in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'teacher_salary_payments';
```

- **If you see a result:** Table exists, just refresh browser
- **If no result:** Run `verify-and-create-salary-tables.sql`

## Still Having Issues?

1. **Check your role:** Make sure you have admin or finance role
2. **Check RLS policies:** Run the SQL file again to recreate policies
3. **Clear all cache:** Close browser completely and reopen
4. **Check Supabase logs:** Look for any error messages in Supabase dashboard

---

**Quick Fix:** Run `verify-and-create-salary-tables.sql` then hard refresh browser!
