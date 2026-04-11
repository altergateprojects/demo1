# Diagnose Notifications Page Black Screen

## Possible Causes

1. **Missing notifications table** - Database table doesn't exist
2. **RLS policy blocking** - User doesn't have permission
3. **API error** - notifications.api.js has an error
4. **Hook error** - useNotifications hook failing
5. **Component error** - NotificationsPage has a rendering issue

## Quick Fix Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and check Console tab for errors.

### Step 2: Check if notifications table exists
Run this SQL:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);
```

### Step 3: Check if you have notifications
Run this SQL:
```sql
SELECT COUNT(*) FROM notifications;
```

### Step 4: Check RLS policies
Run this SQL:
```sql
SELECT * FROM notifications LIMIT 1;
```

If this fails, RLS is blocking you.

## Most Likely Issue

The notifications table probably doesn't exist yet. You need to run:
`notification-system-schema.sql`

This will create:
- notifications table
- RLS policies
- Trigger functions
- Indexes
