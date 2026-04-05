# Student Dues Payment System with Partial Payments

## Overview
Complete payment tracking system for student dues that supports:
- ✅ Partial payments over time
- ✅ Full payment history with audit trail
- ✅ Automatic clearing when fully paid
- ✅ Multiple payment methods
- ✅ Payment references and notes
- ✅ Real-time remaining balance tracking

## Database Setup

### Step 1: Run the Payment System Schema
Run this SQL file in Supabase SQL Editor:
```
student-dues-payment-system.sql
```

This creates:
- `student_due_payments` table for payment logs
- `amount_paid_paise` column in `student_dues` table
- Functions for adding payments and viewing history
- RLS policies for security

## Features

### 1. Pay Dues Button
- Click "💰 Pay" button on any pending due
- Opens payment modal with:
  - Student information
  - Total due amount breakdown (Fee + Pocket Money)
  - Amount already paid (if any)
  - Remaining balance
  - Quick amount buttons (25%, 50%, 75%, Full)
  - Payment method selection
  - Payment reference field
  - Notes field

### 2. Partial Payments
- Pay any amount up to the remaining balance
- System tracks each payment separately
- Shows running total of paid amount
- Displays remaining balance in real-time
- Prevents overpayment

### 3. Payment History
- Click "📋 History" button to view all payments
- Shows:
  - Payment number and amount
  - Payment date
  - Payment method (Cash, Online, UPI, etc.)
  - Payment reference
  - Notes
  - Who recorded the payment
  - Progress bar showing % paid

### 4. Automatic Clearing
- When total paid >= total due, the due is automatically:
  - Marked as cleared
  - Moved to "Cleared Dues" tab
  - Cleared date set to last payment date
  - Cleared by user recorded

### 5. Payment Methods Supported
- Cash
- Online Transfer
- Cheque
- Card
- UPI
- Other

## How It Works

### Scenario 1: Single Full Payment
```
Student: Rahul Kumar
Total Due: ₹5,000 (Fee: ₹3,000 + Pocket Money: ₹2,000)

Payment 1: ₹5,000 (Full Amount)
Result: Due automatically moved to Cleared section
```

### Scenario 2: Multiple Partial Payments
```
Student: Priya Sharma
Total Due: ₹10,000 (Fee: ₹7,000 + Pocket Money: ₹3,000)

Payment 1: ₹3,000 (30%)
Remaining: ₹7,000

Payment 2: ₹2,000 (20%)
Remaining: ₹5,000

Payment 3: ₹5,000 (50%)
Remaining: ₹0
Result: Due automatically moved to Cleared section
```

### Scenario 3: Mixed Payments Over Time
```
Student: Amit Patel (Passed Out)
Total Due: ₹15,000 (Fee: ₹10,000 + Pocket Money: ₹5,000)

Jan 15: ₹2,000 (Cash)
Feb 10: ₹3,000 (Online Transfer - Ref: TXN123456)
Mar 5: ₹5,000 (UPI - Ref: UPI789012)
Apr 1: ₹5,000 (Cheque - Ref: CHQ001)
Result: Fully paid, moved to Cleared section
```

## UI Features

### Pending Dues Table
- Shows remaining amount prominently
- Displays "Paid: ₹X" under each due type if partially paid
- Action buttons: Pay and History
- Color-coded amounts:
  - Red: Fee dues
  - Purple: Pocket money dues
  - Green: Paid amounts
  - Slate: Total remaining

### Payment Modal
- Clean, intuitive interface
- Quick amount buttons for common percentages
- Validation to prevent overpayment
- Real-time calculation of remaining balance
- Support for payment references (transaction IDs, cheque numbers)
- Optional notes field

### Payment History Modal
- Chronological list of all payments
- Payment method badges with colors
- Progress bar showing payment completion
- Summary cards showing Total Due, Total Paid, Remaining
- Numbered payments for easy reference

## Fraud Prevention

### Built-in Safeguards
1. Cannot pay more than remaining amount
2. All payments logged with timestamp and user
3. Cannot delete or modify past payments (audit trail)
4. Automatic calculation prevents manual errors
5. Database-level constraints ensure data integrity

### Audit Trail
Every payment records:
- Exact amount in paise (no rounding errors)
- Payment date
- Payment method
- Payment reference
- Who recorded it
- When it was recorded
- Optional notes

## API Functions

### Add Payment
```javascript
await addDuePayment(studentDueId, {
  payment_amount_paise: 500000, // ₹5,000
  payment_date: '2024-01-15',
  payment_method: 'cash',
  payment_reference: 'TXN123',
  notes: 'Partial payment'
})
```

### Get Payment History
```javascript
const history = await getDuePaymentHistory(studentDueId)
// Returns array of all payments with details
```

### Get Payment Summary
```javascript
const summary = await getStudentPaymentSummary(studentId)
// Returns total dues, paid, remaining, counts
```

## Database Functions

### add_student_due_payment()
- Adds payment to a due
- Updates amount_paid_paise
- Auto-marks as cleared when fully paid
- Returns payment details and remaining balance
- Prevents overpayment

### get_student_due_payment_history()
- Returns all payments for a due
- Includes user who recorded each payment
- Ordered by date (newest first)

### get_student_payment_summary()
- Aggregates all dues for a student
- Shows total dues, paid, remaining
- Counts number of dues and payments

## Best Practices

### For School Staff
1. Always record payments on the same day they're received
2. Use payment references for non-cash payments
3. Add notes for context (e.g., "Parent requested installment plan")
4. Check payment history before accepting new payments
5. Verify remaining balance before recording payment

### For Administrators
1. Review payment history regularly
2. Monitor partially paid dues
3. Follow up on long-pending dues
4. Use payment method data for financial reporting
5. Maintain payment references for reconciliation

## Troubleshooting

### Payment Not Showing
- Refresh the page
- Check if payment was recorded (view history)
- Verify payment amount was within remaining balance

### Due Not Moving to Cleared
- Check if total paid >= total due
- Verify all payments were recorded
- Check payment history for any errors

### Cannot Add Payment
- Ensure amount is greater than zero
- Verify amount doesn't exceed remaining balance
- Check if due is already cleared

## Future Enhancements
- Print payment receipts
- SMS/Email notifications on payment
- Payment reminders for pending dues
- Bulk payment recording
- Payment plan scheduling
- Export payment history to Excel

## Summary
This system provides a complete, fraud-proof solution for tracking student dues with partial payment support. It maintains a full audit trail, prevents errors, and automatically manages the lifecycle of dues from pending to cleared.
