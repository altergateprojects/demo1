# Salary System Error - Quick Fix

## The Problem
You're seeing this error:
```
400 Bad Request
teacher_salary_payments table doesn't exist
```

## The Solution (2 Minutes)

### 1. Open Supabase SQL Editor
- Go to your Supabase Dashboard
- Click "SQL Editor" in the sidebar

### 2. Copy This File
- Open: `add-salary-payment-tables.sql`
- Select all (Ctrl+A / Cmd+A)
- Copy (Ctrl+C / Cmd+C)

### 3. Run in Supabase
- Paste into SQL Editor
- Click "Run" button
- Wait for success message

### 4. Refresh Your App
- Go back to your app
- Press F5 to refresh
- Navigate to `/salary`
- Error should be gone!

## That's It!

The error happens because the database tables don't exist yet. Running the SQL file creates them.

---

**File to use:** `add-salary-payment-tables.sql`  
**Takes:** 2 minutes  
**Result:** Working salary system ✅
