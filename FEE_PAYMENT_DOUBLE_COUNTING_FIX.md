# Fee Payment Double Counting Fix

## Problem

When recording a fee payment of ₹50:
- **Dashboard shows**: ₹100 (WRONG - doubled)
- **Transaction list shows**: ₹50 (CORRECT)

## Root Cause

The system has TWO mechanisms updating the student's `fee_paid_paise`:

1. **Smart Payment Function** (`process_fee_payment_with_allocation`):
   - Manually updates `students.fee_paid_paise` based on allocation logic
   - Handles previous years debt, current year fees, and pocket money

2. **Database Trigger** (`trg_update_fee_paid`):
   - Automatically fires AFTER INSERT on `fee_payments` table
   - ALSO updates `students.fee_paid_paise` with the payment amount

### The Double Counting Flow:

```
User pays ₹50 (5000 paise)
    ↓
Smart function adds 5000 to fee_paid_paise ✓
    ↓
Smart function inserts into fee_payments (amount: 5000)
    ↓
Trigger fires and ALSO adds 5000 to fee_paid_paise ✗
    ↓
Result: fee_paid_paise increased by 10000 instead of 5000
```

## Solution

Modified the trigger to **skip smart payments** by detecting the allocation notes:

```sql
-- Skip if this is a smart payment (identified by notes containing allocation info)
IF NEW.notes LIKE '%Applied%to previous years%' OR 
   NEW.notes LIKE '%Applied%to current year%' THEN
  RETURN NEW;  -- Skip the duplicate update
END IF;
```

Smart payments add allocation details to notes like:
- "Applied ₹50 to current year"
- "Applied ₹30 to previous years | Applied ₹20 to current year"

## Fix Script

Run `fix-fee-payment-double-counting.sql` in Supabase SQL Editor.

This script will:
1. ✅ Update the trigger to skip smart payments
2. ✅ Recalculate all student balances from actual payment records
3. ✅ Fix any existing double-counted amounts
4. ✅ Show verification results

## Verification

After running the fix, the verification query will show:
- Student name
- Current `fee_paid_paise` value
- Actual sum from `fee_payments` table
- Status: ✓ CORRECT or ✗ MISMATCH

All students should show "✓ CORRECT" after the fix.

## Testing

1. Run the fix script
2. Record a new payment of ₹50
3. Check dashboard - should show ₹50 (not ₹100)
4. Check transaction list - should show ₹50
5. Check student detail page - `fee_paid` should increase by exactly ₹50

## Why This Happened

The smart payment function was added later to handle complex allocation logic (previous years debt, pocket money overflow). The original trigger wasn't updated to exclude these smart payments, causing the double counting.

## Prevention

Going forward:
- Smart payments are identified by their allocation notes
- Trigger automatically skips them
- Regular payments (if any) still work with the trigger
- No code changes needed in the frontend
