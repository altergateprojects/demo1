# Dashboard Expenses Showing Zero - Fix Guide

## Problem
Dashboard shows ₹0.00 for expenses, but Reports page shows ₹409.97 correctly.

## Root Cause
The expenses have dates OUTSIDE the current academic year range (2024-06-01 to 2025-05-31). Since today is April 5, 2026, any expenses added recently have dates AFTER the academic year ends.

- Dashboard filters expenses by academic year date range
- Reports page uses custom date range (current month by default)
- That's why Reports shows expenses but Dashboard doesn't

## Solutions

### Option 1: Fix Expense Dates (Recommended)
Update expense dates to fall within the current academic year.

**Run this SQL script:**
```bash
# Copy and paste the contents of fix-expense-dates-for-dashboard.sql into Supabase SQL Editor
```

This will:
- Move expenses after year-end to the last day of academic year (2025-05-31)
- Move expenses before year-start to the first day of academic year (2024-06-01)
- Set NULL dates to today (capped at year-end)

### Option 2: Create New Academic Year
If you're actually in a new academic year (2025-26), create it:

```sql
INSERT INTO academic_years (year_label, start_date, end_date, is_current)
VALUES ('2025-26', '2025-06-01', '2026-05-31', true);

-- Set old year to not current
UPDATE academic_years 
SET is_current = false 
WHERE year_label = '2024-25';
```

### Option 3: Remove Date Filter from Dashboard
Modify dashboard to show ALL expenses regardless of date (not recommended for multi-year systems).

## Verification Steps

After applying the fix:

1. Refresh the dashboard page
2. Check that "Total Expenses" shows ₹409.97 (matching Reports page)
3. Verify "Net Balance" is calculated correctly

## Prevention

Going forward, when adding expenses:
- Ensure expense_date is set to a date within the current academic year
- Or create a new academic year when the current one ends
- The system should validate expense dates on entry
