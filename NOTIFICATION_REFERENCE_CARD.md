# Notification System - Quick Reference Card

## 🚀 Setup (1 Step)

```bash
1. Open Supabase SQL Editor
2. Run: notification-system-schema.sql
3. Done! ✅
```

## 🔔 What Gets Notified

| Event | Threshold | Priority | Icon |
|-------|-----------|----------|------|
| Large Expense | >₹5,000 | Normal | 💰 |
| Large Expense | >₹10,000 | High | 💰 |
| Large Expense | >₹20,000 | Critical | 💰 |
| Expense Edit | Any change | Normal | ✏️ |
| Expense Edit | Amount >₹1,000 | High | ✏️ |
| Payment Edit | Any change | High | 💳 |

## 📍 Where to Find

- **Bell Icon:** Top navbar (next to theme icon)
- **Full Page:** `/notifications` or click "View all"
- **Badge:** Shows unread count

## 🎯 Quick Actions

```javascript
// Mark as read
Click notification

// Mark all read
Click "Mark all read" button

// Navigate to source
Click notification (auto-navigates)

// Filter
Use dropdown filters on full page
```

## 🔧 Customization

### Change Threshold (₹5,000 → Your Value)

```sql
-- Edit line ~180 in notification-system-schema.sql
IF NEW.amount_paise > 500000 THEN  -- Change this
```

### Disable Expense Edits

```sql
DROP TRIGGER trigger_notify_expense_edit ON expenses;
```

### Re-enable

```sql
CREATE TRIGGER trigger_notify_expense_edit
  AFTER UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION notify_expense_edit();
```

## 🧪 Test

### Create Test Notification

```sql
SELECT create_admin_notification(
  'expense_large',
  'Test Notification',
  'Test message for ₹10,000',
  NULL, NULL, 1000000, 'high', NULL
);
```

### Create Real Notification

1. Add expense >₹5,000
2. Or edit any expense
3. Check bell icon

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Bell not showing | Only for admins - check role |
| No notifications | Check triggers installed |
| Real-time not working | Fallback: auto-refresh 30s |
| Permission error | Verify RLS policies |

### Quick Checks

```sql
-- Check table
SELECT COUNT(*) FROM admin_notifications;

-- Check triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'expenses';

-- Check role
SELECT role FROM user_profiles WHERE id = auth.uid();
```

## 📊 Priority Colors

- 🔴 **Critical** - Red (>₹20,000)
- 🟠 **High** - Orange (>₹10,000, edits)
- 🔵 **Normal** - Blue (>₹5,000)
- ⚪ **Low** - Gray (minor)

## 🎨 UI Components

### Bell Component
- Location: `src/components/shared/NotificationBell.jsx`
- Shows: Unread count, dropdown, recent 20

### Full Page
- Location: `src/pages/Notifications/NotificationsPage.jsx`
- URL: `/notifications`
- Shows: All notifications, filters, stats

## 📚 Documentation

- `NOTIFICATION_QUICK_START.md` - 2-min setup
- `NOTIFICATION_SYSTEM_COMPLETE.md` - Full guide
- `NOTIFICATION_SYSTEM_SUMMARY.md` - Overview
- This file - Quick reference

## 🔑 Key Functions

```javascript
// React Hooks
useNotifications(50, false)  // Get notifications
useUnreadCount()             // Get count
useMarkAsRead()              // Mark as read
useMarkAllAsRead()           // Mark all
useRealtimeNotifications()   // Real-time

// API
getNotifications(limit, unreadOnly)
getUnreadCount()
markAsRead(id)
markAllAsRead()
```

## 📦 Files

### Database
- `notification-system-schema.sql`

### Frontend
- `src/api/notifications.api.js`
- `src/hooks/useNotifications.js`
- `src/components/shared/NotificationBell.jsx`
- `src/pages/Notifications/NotificationsPage.jsx`
- `src/components/layout/Topbar.jsx` (modified)
- `src/App.jsx` (modified)

## ✅ Checklist

- [ ] Run SQL setup
- [ ] See bell icon in navbar
- [ ] Create test notification
- [ ] See badge with "1"
- [ ] Click to view
- [ ] Click to mark as read
- [ ] Test with real expense
- [ ] Check full page works

## 🎉 Done!

Your notification system is ready!

**Setup:** 2 minutes
**Test:** 1 minute
**Total:** 3 minutes

---

**Need help?** Check `NOTIFICATION_SYSTEM_COMPLETE.md`
