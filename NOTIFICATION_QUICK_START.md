# Notification System - Quick Start (2 Minutes)

## What You Get

A notification bell (🔔) in the navbar that alerts admins about:
- Expense edits
- Large expenses (>₹5,000)
- Fee payment corrections

## Installation (1 Step!)

### Run This SQL

1. Open Supabase SQL Editor
2. Open file: `notification-system-schema.sql`
3. Copy entire content
4. Paste and run

That's it! ✅

## Test It

### Option 1: Create Test Notification

Run this in SQL Editor:

```sql
SELECT create_admin_notification(
  'expense_large',
  'Test: Large Expense Alert',
  'Someone created an expense of ₹10,000',
  'expense',
  NULL,
  1000000,
  'high',
  '{"test": true}'::jsonb
);
```

### Option 2: Create Real Notification

1. Go to Expenses → Add Expense
2. Enter amount: ₹6,000 (or more)
3. Fill other details
4. Save

### Option 3: Edit an Expense

1. Go to any expense
2. Click Edit
3. Change amount or description
4. Save

## Verify

1. Look at top navbar (next to theme icon)
2. You should see bell icon (🔔) with red badge showing "1"
3. Click bell to see notification
4. Click notification to mark as read

## Features

### Notification Bell
- Shows unread count
- Dropdown with recent notifications
- Click to mark as read
- Navigate to related item

### Full Page
- Click "View all notifications" in dropdown
- Or go to: `/notifications`
- Filter by read/unread
- Filter by type
- See all details

### Auto-Triggers

**Large Expenses (>₹5,000):**
- Critical: >₹20,000 (red)
- High: >₹10,000 (orange)
- Normal: >₹5,000 (blue)

**Expense Edits:**
- Any change to amount, description, category, vendor
- High priority if amount change >₹1,000

**Payment Edits:**
- Any change to fee payment amount
- Always high priority

## Customization

### Change Large Expense Threshold

Edit in `notification-system-schema.sql` line ~180:

```sql
-- Change 500000 (₹5,000) to your value
IF NEW.amount_paise > 500000 THEN
```

### Add More Triggers

See `NOTIFICATION_SYSTEM_COMPLETE.md` for full guide.

## Troubleshooting

### Bell Not Showing?
- Only visible for admins
- Check: `SELECT role FROM user_profiles WHERE id = auth.uid();`
- Should return 'admin'

### No Notifications?
- Check triggers installed:
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'expenses';
```
- Should see: `trigger_notify_expense_edit`, `trigger_notify_large_expense`

### Still Not Working?
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors
- Verify SQL ran without errors

## What's Next?

Read `NOTIFICATION_SYSTEM_COMPLETE.md` for:
- Full API reference
- Customization options
- Adding new notification types
- Performance optimization
- Security best practices

## Summary

1. Run `notification-system-schema.sql` ✅
2. Create test notification or add large expense ✅
3. See bell icon with badge ✅
4. Click to view and mark as read ✅

Done! Your notification system is live! 🎉

---

**Time to setup:** 2 minutes
**Time to test:** 1 minute
**Total:** 3 minutes

Enjoy your new notification system! 🔔
