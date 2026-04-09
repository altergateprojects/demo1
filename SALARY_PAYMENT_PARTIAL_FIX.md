# Salary Payment System - Partial Payment Support

## What Was Fixed

### 1. Partial Payment Detection & Handling
- System now detects when payment amount is less than expected salary
- Shows warning with remaining amount
- Requires explicit confirmation via checkbox for partial payments
- Status changes from "paid" to "partial" for incomplete payments

### 2. Payment Status System
- **Paid**: Full salary paid (green)
- **Partial**: Some amount paid but not full (orange) - NEW!
- **Pending**: No payment yet (yellow)
- **Overdue**: Past due date with no payment (red)

### 3. UI Improvements
- Added 5th summary card for "Partial" payments
- Payment modal shows:
  - Expected salary vs actual payment
  - Remaining amount to be paid
  - Yellow warning box for partial payments
  - Confirmation checkbox required
- Table shows paid amount for partial payments
- Button text changes to "Pay Remaining" for partial payments

### 4. Database Changes
- Changed `recorded_by` to `performed_by` (matches your schema)
- Status can now be: 'paid', 'partial', 'pending', 'cancelled'
- Tracks multiple payments per teacher per month

### 5. Salary History Issue
- Added error logging to help debug
- Created SQL file to check table structure: `check-salary-history-table.sql`

## How It Works

### Full Payment Flow
1. User clicks "Pay Salary"
2. Modal opens with expected salary pre-filled
3. User enters payment details
4. If amount = expected salary → Status: "paid" (green)
5. Teacher removed from pending list

### Partial Payment Flow
1. User clicks "Pay Salary"
2. Modal opens with expected salary pre-filled
3. User enters lower amount (e.g., ₹5,000 of ₹40,000)
4. Yellow warning appears showing:
   - "You're paying ₹5,000 out of ₹40,000"
   - "Remaining: ₹35,000"
5. User must check "I confirm this is a partial payment"
6. Status: "partial" (orange)
7. Teacher stays in list with "Pay Remaining" button
8. Next payment adds to total until full amount paid

### Multiple Partial Payments
- System tracks all payments for a month
- Calculates total paid amount
- When total ≥ expected salary → Status changes to "paid"
- Example:
  - Payment 1: ₹5,000 → Status: partial
  - Payment 2: ₹10,000 → Status: partial (₹15,000 total)
  - Payment 3: ₹25,000 → Status: paid (₹40,000 total)

## Files Modified

### Frontend
- `src/components/shared/SalaryPaymentModal.jsx` - Added partial payment detection & UI
- `src/pages/Salary/SalaryManagementPage.jsx` - Added partial status handling
- `src/api/teacherSalary.api.js` - Updated to use `performed_by`, handle partial status
- `src/hooks/useTeacherSalary.js` - No changes needed

### SQL Files Created
- `check-salary-history-table.sql` - Debug salary history table
- `fix-salary-payments-columns.sql` - Check and fix column names

## Next Steps

1. **Run SQL to check columns:**
   ```sql
   -- Run: fix-salary-payments-columns.sql
   -- This will show your actual table structure
   ```

2. **Hard refresh browser:**
   - Windows/Linux: Ctrl + Shift + R
   - Mac: Cmd + Shift + R
   - This clears Supabase schema cache

3. **Test partial payment:**
   - Go to Salary Management
   - Select current month
   - Click "Pay Salary" for a teacher
   - Enter amount less than expected
   - Confirm partial payment checkbox
   - Submit and verify status shows "partial"

4. **Check salary history:**
   - Run: `check-salary-history-table.sql`
   - Check browser console for any errors
   - Verify table exists and has data

## Common Issues

### Issue: "recorded_by column not found"
**Solution**: Already fixed - changed to `performed_by`

### Issue: Salary history not showing
**Possible causes:**
1. Table doesn't exist
2. No data in table
3. Foreign key name mismatch
4. RLS policy blocking access

**Debug:**
- Run `check-salary-history-table.sql`
- Check browser console for errors
- Verify you have salary history records

### Issue: Partial payment not detected
**Cause**: Browser cache
**Solution**: Hard refresh (Ctrl+Shift+R)

## Database Schema Requirements

Your `teacher_salary_payments` table should have:
- `performed_by` (not `recorded_by`)
- `status` TEXT (values: 'paid', 'partial', 'pending', 'cancelled')
- `base_salary_paise` BIGINT
- `bonus_amount_paise` BIGINT
- `deduction_amount_paise` BIGINT
- `total_amount_paise` BIGINT
- `salary_month` DATE
- `teacher_id` UUID
- `academic_year_id` UUID

## Benefits

1. **Flexibility**: Pay teachers in installments if needed
2. **Transparency**: Clear tracking of partial vs full payments
3. **Accuracy**: No confusion about payment status
4. **Audit Trail**: All payments recorded with amounts
5. **User-Friendly**: Clear warnings and confirmations
