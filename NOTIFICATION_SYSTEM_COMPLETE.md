## Admin Notification System - Complete Implementation

## Overview

A comprehensive notification system that alerts admins about:
- ✅ Expense edits/modifications
- ✅ Large expenses (>₹5,000)
- ✅ Fee payment edits/corrections
- ✅ Real-time updates
- ✅ Priority levels (low, normal, high, critical)

## Features

### 1. Notification Bell in Navbar
- Shows unread count badge
- Dropdown with recent 20 notifications
- Click to mark as read
- Navigate to related entity
- Real-time updates

### 2. Full Notifications Page
- View all notifications
- Filter by read/unread status
- Filter by notification type
- Priority-based styling
- Detailed information
- Click to navigate to source

### 3. Automatic Triggers

#### Expense Edits
- Triggers when expense is modified
- Tracks: amount, description, category, vendor changes
- Priority: High if amount change >₹1,000

#### Large Expenses
- Triggers when new expense >₹5,000
- Priority levels:
  - Critical: >₹20,000
  - High: >₹10,000
  - Normal: >₹5,000

#### Payment Corrections
- Triggers when fee payment amount is edited
- Always High priority
- Includes student information

## Installation

### Step 1: Run Database Setup

```bash
# Open Supabase SQL Editor
# Run: notification-system-schema.sql
```

This creates:
- `admin_notifications` table
- Trigger functions for auto-notifications
- RLS policies (admin-only access)
- Helper functions

### Step 2: Files Already Created

Frontend files (already in place):
- ✅ `src/api/notifications.api.js` - API functions
- ✅ `src/hooks/useNotifications.js` - React hooks
- ✅ `src/components/shared/NotificationBell.jsx` - Bell component
- ✅ `src/pages/Notifications/NotificationsPage.jsx` - Full page
- ✅ `src/components/layout/Topbar.jsx` - Updated with bell
- ✅ `src/App.jsx` - Route added

### Step 3: Verify Installation

1. **Check Database:**
```sql
-- Should return the table
SELECT * FROM admin_notifications LIMIT 1;

-- Should return functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%notification%';
```

2. **Test in UI:**
- Login as admin
- Look for bell icon (🔔) in top navbar
- Should show "0" initially

3. **Create Test Notification:**
```sql
SELECT create_admin_notification(
  'expense_large',
  'Test Notification',
  'This is a test notification for ₹10,000',
  'expense',
  NULL,
  1000000,
  'high',
  '{"test": true}'::jsonb
);
```

4. **Verify:**
- Bell should show "1"
- Click bell to see notification
- Click notification to mark as read

## Usage

### For Admins

#### View Notifications
1. Click bell icon in navbar
2. See recent 20 notifications
3. Click "View all notifications" for full page

#### Mark as Read
- Click individual notification
- Or click "Mark all read" button

#### Navigate to Source
- Click notification to go to related expense/payment/student

### For Developers

#### Add Custom Notification

```javascript
import { createNotification } from '../api/notifications.api'

await createNotification({
  type: 'expense_edit',
  title: 'Custom Notification',
  message: 'Something important happened',
  entityType: 'expense',
  entityId: expenseId,
  amountPaise: 500000, // ₹5,000
  priority: 'high',
  metadata: { custom: 'data' }
})
```

#### Subscribe to Real-time

```javascript
import { useRealtimeNotifications } from '../hooks/useNotifications'

// In your component
useRealtimeNotifications(true) // Enables real-time updates
```

## Notification Types

| Type | Description | Trigger | Priority |
|------|-------------|---------|----------|
| `expense_edit` | Expense modified | UPDATE on expenses | Normal/High |
| `expense_large` | Large expense created | INSERT on expenses >₹5k | Normal/High/Critical |
| `payment_edit` | Fee payment modified | UPDATE on fee_payments | High |
| `payment_correction` | Payment corrected | Manual correction | High |
| `student_edit` | Student info edited | Future enhancement | Normal |
| `teacher_edit` | Teacher info edited | Future enhancement | Normal |

## Priority Levels

| Priority | Color | Use Case |
|----------|-------|----------|
| Critical | Red | Expenses >₹20,000 |
| High | Orange | Expenses >₹10,000, Payment edits |
| Normal | Blue | Expenses >₹5,000, Regular edits |
| Low | Gray | Minor changes |

## Database Schema

### admin_notifications Table

```sql
id                UUID PRIMARY KEY
type              VARCHAR(50)      -- Notification type
title             VARCHAR(255)     -- Short title
message           TEXT             -- Detailed message
entity_type       VARCHAR(50)      -- 'expense', 'fee_payment', etc.
entity_id         UUID             -- Related entity ID
amount_paise      BIGINT           -- Amount if applicable
performed_by      UUID             -- User who performed action
is_read           BOOLEAN          -- Read status
read_at           TIMESTAMP        -- When marked read
read_by           UUID             -- Who marked read
priority          VARCHAR(20)      -- Priority level
metadata          JSONB            -- Additional context
created_at        TIMESTAMP        -- When created
```

### Functions

- `create_admin_notification()` - Create new notification
- `mark_notification_read()` - Mark single as read
- `mark_all_notifications_read()` - Mark all as read
- `get_unread_notification_count()` - Get count
- `get_recent_notifications()` - Fetch notifications

### Triggers

- `trigger_notify_expense_edit` - On expense UPDATE
- `trigger_notify_large_expense` - On expense INSERT
- `trigger_notify_payment_correction` - On payment UPDATE

## API Reference

### Get Notifications

```javascript
import { getNotifications } from '../api/notifications.api'

const notifications = await getNotifications(50, false)
// limit: 50, unreadOnly: false
```

### Get Unread Count

```javascript
import { getUnreadCount } from '../api/notifications.api'

const count = await getUnreadCount()
```

### Mark as Read

```javascript
import { markAsRead } from '../api/notifications.api'

await markAsRead(notificationId)
```

### Mark All as Read

```javascript
import { markAllAsRead } from '../api/notifications.api'

const count = await markAllAsRead()
// Returns number of notifications marked
```

## React Hooks

### useNotifications

```javascript
import { useNotifications } from '../hooks/useNotifications'

const { data: notifications, isLoading } = useNotifications(50, false)
```

### useUnreadCount

```javascript
import { useUnreadCount } from '../hooks/useNotifications'

const { data: unreadCount } = useUnreadCount()
```

### useMarkAsRead

```javascript
import { useMarkAsRead } from '../hooks/useNotifications'

const markAsReadMutation = useMarkAsRead()
markAsReadMutation.mutate(notificationId)
```

### useRealtimeNotifications

```javascript
import { useRealtimeNotifications } from '../hooks/useNotifications'

useRealtimeNotifications(true) // Enable real-time
```

## Customization

### Add New Notification Type

1. **Update Schema:**
```sql
ALTER TABLE admin_notifications 
DROP CONSTRAINT valid_type;

ALTER TABLE admin_notifications 
ADD CONSTRAINT valid_type CHECK (type IN (
  'expense_edit', 'expense_large', 'payment_edit', 
  'your_new_type' -- Add here
));
```

2. **Create Trigger:**
```sql
CREATE OR REPLACE FUNCTION notify_your_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'your_new_type',
    'Your Title',
    'Your message',
    'entity_type',
    NEW.id,
    NULL,
    'normal',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_your_event
  AFTER INSERT ON your_table
  FOR EACH ROW
  EXECUTE FUNCTION notify_your_event();
```

3. **Update UI:**
Add icon in `getTypeIcon()` function in NotificationBell.jsx

### Change Threshold for Large Expenses

Edit in `notification-system-schema.sql`:

```sql
-- Change from 500000 (₹5,000) to your value
IF NEW.amount_paise > 500000 THEN
```

### Customize Priority Logic

Edit priority calculation in trigger functions:

```sql
CASE 
  WHEN NEW.amount_paise > 2000000 THEN 'critical'
  WHEN NEW.amount_paise > 1000000 THEN 'high'
  ELSE 'normal'
END
```

## Troubleshooting

### Bell Not Showing

**Issue:** Bell icon not visible in navbar

**Solution:**
1. Check if logged in as admin
2. Bell only shows for `role = 'admin'`
3. Check Topbar.jsx has NotificationBell import

### No Notifications Appearing

**Issue:** Notifications not being created

**Solution:**
1. Check triggers are installed:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table IN ('expenses', 'fee_payments');
```

2. Test manually:
```sql
SELECT create_admin_notification(
  'expense_large', 'Test', 'Test message',
  NULL, NULL, 1000000, 'high', NULL
);
```

### Real-time Not Working

**Issue:** New notifications don't appear automatically

**Solution:**
1. Check Supabase Realtime is enabled
2. Verify subscription in browser console
3. Fallback: Notifications refetch every 15-30 seconds

### Permission Errors

**Issue:** "permission denied" errors

**Solution:**
1. Check RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'admin_notifications';
```

2. Verify user is admin:
```sql
SELECT role FROM user_profiles WHERE id = auth.uid();
```

## Performance

### Optimization Tips

1. **Limit Notifications:**
   - Auto-delete old notifications (>90 days)
   - Keep only recent 1000 per user

2. **Index Usage:**
   - Indexes already created on key columns
   - Query performance should be <50ms

3. **Real-time:**
   - Uses Supabase Realtime (WebSocket)
   - Minimal overhead
   - Fallback to polling if needed

### Cleanup Old Notifications

```sql
-- Delete notifications older than 90 days
DELETE FROM admin_notifications 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Or mark as archived
ALTER TABLE admin_notifications ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
UPDATE admin_notifications SET is_archived = TRUE 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Security

### Access Control

- ✅ Only admins can view notifications
- ✅ RLS policies enforce access
- ✅ Triggers run with SECURITY DEFINER
- ✅ No sensitive data in notifications

### Best Practices

1. Don't include passwords or tokens in notifications
2. Sanitize user input in messages
3. Limit notification rate (prevent spam)
4. Audit notification access

## Testing

### Manual Test

1. **Create Large Expense:**
   - Go to Expenses → Add Expense
   - Enter amount >₹5,000
   - Save
   - Check bell for notification

2. **Edit Expense:**
   - Go to any expense
   - Click Edit
   - Change amount or description
   - Save
   - Check bell for notification

3. **Edit Payment:**
   - Go to student detail
   - Find a fee payment
   - Edit amount
   - Save
   - Check bell for notification

### Automated Test

```sql
-- Test expense edit notification
UPDATE expenses 
SET amount_paise = 600000 
WHERE id = (SELECT id FROM expenses LIMIT 1);

-- Check notification created
SELECT * FROM admin_notifications 
WHERE type = 'expense_edit' 
ORDER BY created_at DESC LIMIT 1;

-- Test large expense notification
INSERT INTO expenses (
  description, amount_paise, category, 
  payment_method, expense_date, academic_year_id
) VALUES (
  'Test Large Expense', 1500000, 'salaries',
  'bank_transfer', CURRENT_DATE, 
  (SELECT id FROM academic_years WHERE is_current = TRUE)
);

-- Check notification created
SELECT * FROM admin_notifications 
WHERE type = 'expense_large' 
ORDER BY created_at DESC LIMIT 1;
```

## Future Enhancements

### Planned Features

1. **Email Notifications**
   - Send email for critical notifications
   - Daily digest option

2. **Push Notifications**
   - Browser push notifications
   - Mobile app notifications

3. **Notification Preferences**
   - User can choose which notifications to receive
   - Frequency settings

4. **More Triggers**
   - Student admission/exit
   - Teacher salary changes
   - Fee config changes
   - Report generation

5. **Notification History**
   - Archive old notifications
   - Search and filter
   - Export to CSV

## Support

### Common Questions

**Q: Can staff see notifications?**
A: No, only admins can see notifications.

**Q: How long are notifications kept?**
A: Forever, unless you implement cleanup (see Performance section).

**Q: Can I disable certain notification types?**
A: Yes, drop the specific trigger or add a settings table.

**Q: Do notifications work offline?**
A: No, requires internet connection. They'll sync when back online.

## Files Reference

### Database
- `notification-system-schema.sql` - Complete database setup

### Frontend
- `src/api/notifications.api.js` - API functions
- `src/hooks/useNotifications.js` - React hooks
- `src/components/shared/NotificationBell.jsx` - Bell component
- `src/pages/Notifications/NotificationsPage.jsx` - Full page
- `src/components/layout/Topbar.jsx` - Navbar integration
- `src/App.jsx` - Route configuration

### Documentation
- `NOTIFICATION_SYSTEM_COMPLETE.md` - This file

## Summary

The notification system is production-ready and includes:
- ✅ Real-time notifications
- ✅ Admin-only access
- ✅ Automatic triggers for edits and large expenses
- ✅ Priority-based styling
- ✅ Navigation to source
- ✅ Mark as read functionality
- ✅ Full notifications page
- ✅ Responsive design
- ✅ Dark mode support

Just run the SQL setup and you're good to go! 🎉
