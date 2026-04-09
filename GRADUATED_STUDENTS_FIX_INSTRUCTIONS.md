# Fix: Graduated Students Appearing in Active Student List

## Problem
Student "Shantya" is graduated but still appears in the Students list and can receive payments. This is because:
1. The student's `status` is still `'active'` in the database
2. Graduated students should have `status = 'graduated'`
3. Graduated students should ONLY appear in Alumni page, not in Students list

## Solution Applied

### 1. Frontend Fix (Already Done ✅)
Updated `src/api/students.api.js` to filter students by status:
- Default filter: `status = 'active'` (excludes graduated, withdrawn, left_school)
- This ensures only active students appear in the Students list

### 2. Database Fix (YOU NEED TO RUN THIS)

**Run this SQL in Supabase SQL Editor:**

```sql
-- Update graduated student status
UPDATE students
SET status = 'graduated'
WHERE full_name ILIKE '%shantya%'
AND status != 'graduated'
RETURNING id, full_name, status;
```

## How to Fix

### Step 1: Update Student Status
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the file: `fix-graduated-student-status.sql`
4. This will update Shantya's status to 'graduated'

### Step 2: Add Payment Validation (Recommended)
1. In Supabase SQL Editor
2. Run the file: `add-student-status-validation.sql`
3. This prevents graduated students from receiving payments
4. Adds validation to fee payment and pocket money functions

### Step 3: Verify the Fix
After running both SQL files:

1. **Students List** - Shantya should NOT appear here
   - Only students with `status = 'active'` appear
   - Graduated students are excluded

2. **Alumni Page** - Shantya SHOULD appear here
   - Go to: Students → Alumni
   - All students with `status = 'graduated'` appear here

3. **Payment Functions** - Should reject graduated students
   - Fee payments should not be allowed for graduated students
   - Pocket money transactions should not be allowed

## What the Fix Does

The SQL file `fix-graduated-student-status.sql` contains:

1. **Check current status** - Shows student's current status
2. **Check alumni records** - Verifies if student is in alumni_records table
3. **Update status** - Changes status from 'active' to 'graduated'
4. **Verify students list** - Shows only active students
5. **Verify alumni list** - Shows graduated students

## Expected Behavior After Fix

### Students List (Active Students Only)
- Shows only: `status = 'active'`
- Excludes: graduated, withdrawn, left_school, suspended

### Alumni Page (Graduated Students Only)
- Shows only: `status = 'graduated'`
- Includes graduation date, final standard, etc.

### Payment Functions
- Fee payments: Only allowed for active students
- Pocket money: Only allowed for active students
- Graduated students: Cannot receive any payments

## Status Filter Options

The Students List page has a status filter with these options:
- **Active Students (Default)** - Shows only active students
- **Active Only** - Same as default
- **Suspended** - Shows suspended students
- **Withdrawn** - Shows withdrawn students
- **Alumni** - Shows graduated students (same as Alumni page)
- **All Students** - Shows all students regardless of status

## Important Notes

1. **Default Behavior**: By default, the Students list shows ONLY active students
2. **Alumni Page**: Graduated students appear ONLY in the Alumni page
3. **Status Field**: The `status` field in the database determines where students appear
4. **No Payments**: Graduated students should not be able to receive payments

## Files Involved

- `src/api/students.api.js` - Frontend filter (already fixed ✅)
- `fix-graduated-student-status.sql` - Database update (needs to be run)
- `add-student-status-validation.sql` - Payment validation (recommended)
- `src/pages/Students/StudentsListPage.jsx` - UI with status filter
- `src/pages/Students/AlumniPage.jsx` - Alumni page for graduated students

## Payment Validation

The `add-student-status-validation.sql` file adds validation to:

1. **Fee Payment Function** (`record_fee_payment_smart`)
   - Checks if student status is 'active'
   - Rejects payments for graduated, withdrawn, suspended students
   - Error message: "Cannot process payment for [status] student"

2. **Pocket Money Function** (`record_pocket_money_transaction`)
   - Same validation as fee payments
   - Prevents transactions for non-active students

3. **Deleted Students**
   - Both functions check `is_deleted = FALSE`
   - Prevents any transactions for deleted students

## Quick Test

After running the SQL:

1. Go to Students list → Shantya should NOT be there
2. Go to Alumni page → Shantya SHOULD be there
3. Try to record payment for Shantya → Should be rejected (if implemented)

---

**Status**: Frontend fixed ✅ | Database needs update ⚠️ | Payment validation ready ✅

**Action Required**: 
1. Run `fix-graduated-student-status.sql` in Supabase (REQUIRED)
2. Run `add-student-status-validation.sql` in Supabase (RECOMMENDED)
