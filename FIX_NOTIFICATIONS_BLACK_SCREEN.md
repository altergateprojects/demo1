# Fix Notifications Page Black Screen

## Problem
When clicking "View All" on notifications, the page goes black.

## Root Cause
The notifications database table and functions haven't been created yet.

## Solution

### Step 1: Run the Notification Schema (REQUIRED)

Open Supabase SQL Editor and run: `notification-system-schema.sql`

This creates:
- `admin_notifications` table
- RLS policies (admin-only access)
- Functions: `get_recent_notifications()`, `mark_notification_read()`, etc.
- Trigger functions for auto-notifications
- Indexes for performance

### Step 2: Verify Setup

Run this to check if everything is created:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'admin_notifications'
) as table_exists;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%notification%'
  AND routine_schema = 'public';

-- Test query
SELECT * FROM get_recent_notifications(10, FALSE);
```

### Step 3: Test the Page

1. Refresh the browser
2. Click on the notification bell (🔔)
3. Click "View All"
4. Should now show the notifications page

## Why This Happened

The notification system was designed but the database schema wasn't run yet. The page tries to call `get_recent_notifications()` function which doesn't exist, causing the query to fail and the page to show nothing (black screen).

## Expected Result After Fix

- Notifications page loads properly
- Shows header with stats (Total, Unread, High Priority, Today)
- Shows filters (All, Unread, Read)
- Shows notification list (or "No Notifications" message)
- Real-time updates work

## Files Involved

- **Schema:** `notification-system-schema.sql` (must run this)
- **API:** `src/api/notifications.api.js` (already correct)
- **Hook:** `src/hooks/useNotifications.js` (already correct)
- **Page:** `src/pages/Notifications/NotificationsPage.jsx` (already correct)
- **Bell:** `src/components/shared/NotificationBell.jsx` (already correct)

## Quick Test

After running the schema, test by creating a test notification:

```sql
-- Create a test notification
SELECT create_admin_notification(
  'expense_large',
  'Test Notification',
  'This is a test notification to verify the system works',
  'expense',
  NULL,
  1000000, -- ₹10,000
  'high',
  NULL
);

-- Check if it appears
SELECT * FROM get_recent_notifications(10, FALSE);
```

Then refresh the page and you should see the test notification!

## Summary

**Problem:** Black screen on notifications page  
**Cause:** Database schema not created  
**Fix:** Run `notification-system-schema.sql`  
**Time:** 2 minutes  
**Result:** Fully working notification system! 🎉
