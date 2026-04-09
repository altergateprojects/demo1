# Previous Years Pending Fees - Fixed ✅

## Problem
Student detail page wasn't showing previous years' pending fees carried forward from earlier academic years.

## Solution
Query the `student_year_snapshots` table and sum all `dues_carried_forward_paise` values to get the total previous years pending.

## How It Works

### Database Structure:
- `student_year_snapshots` table stores immutable snapshots when students are promoted
- `dues_carried_forward_paise` column contains the amount carried forward to next year
- Sum of all `dues_carried_forward_paise` for a student = Previous Years Pending

### Fee Summary Display Logic:
```javascript
// Query student_year_snapshots for the student
// Sum all dues_carried_forward_paise values

Previous Years Pending = SUM(dues_carried_forward_paise) from snapshots
Current Year Pending = annual_fee - fee_paid
Total Pending = Previous Years Pending + Current Year Pending
```

### Display Example:
```
Previous Years Pending: ₹5,000  (orange)
─────────────────────────────
Annual Fee (Current Year): ₹10,000
Paid: ₹3,000
Pending (Current Year): ₹7,000  (red)
─────────────────────────────
Total Pending: ₹12,000  (bold red, highlighted)
```

## What Was Changed

### File: `src/api/students.api.js`
Updated `getStudentById` function to:
1. Query `student_year_snapshots` table for the student
2. Select `dues_carried_forward_paise` column
3. Sum all values to get previous years pending
4. Add as `previous_years_pending_paise` to student object

### File: `src/pages/Students/StudentDetailPage.jsx`
Updated the Fee Summary section to:
1. Check if `previous_years_pending_paise` > 0
2. If yes, show previous years pending in orange
3. Show current year fees separately
4. Show total pending highlighted in red

## Database Schema

The `student_year_snapshots` table has these key columns:
- `student_id` - References the student
- `academic_year_id` - The year being snapshotted
- `fee_due_paise` - Unpaid fee for that year (annual_fee - fee_paid)
- `dues_carried_forward_paise` - Amount carried to next year (what we sum)
- `pocket_money_paise` - Pocket money balance at snapshot time
- `promotion_status` - promoted/held_back/exited
- `dues_action` - carried_forward/waived/paid_before_promotion/exit_recorded

## No SQL Changes Needed!

The `student_year_snapshots` table already exists and is:
- Created by the Student Promotion system
- Populated when students are promoted
- Immutable (no updates/deletes allowed)
- Used to track financial history across years

## What You Need to Do

1. **Hard Refresh Browser**: 
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Test It**:
   - Open a student detail page for a student who has been promoted
   - If student has snapshots with `dues_carried_forward_paise` > 0, you'll see previous years pending
   - If student has never been promoted or has no carried forward dues, only current year fees will show

## When Previous Years Pending Shows

Previous years pending will show when:
- Student was promoted with unpaid fees (dues_action = 'carried_forward')
- Student has snapshots in `student_year_snapshots` table
- Sum of `dues_carried_forward_paise` from all snapshots > 0

## Files Modified

1. `src/api/students.api.js` - Updated `getStudentById` to query snapshots
2. `src/pages/Students/StudentDetailPage.jsx` - Updated Fee Summary section (already done)
3. `PREVIOUS_YEARS_PENDING_FIX.md` - This documentation

## Verification

To verify it's working:
1. Go to Student Promotion page
2. Note which students have been promoted (they will have snapshots)
3. Open those students' detail pages
4. Fee Summary should show previous years pending if they had carried forward dues

The feature is now correctly implemented - just hard refresh your browser!
