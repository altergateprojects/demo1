# Exit Due Payment System - Complete Implementation

## Overview
This system allows students who have been moved to the Student Dues section (via the deletion modal) to have their dues paid and tracked just like regular student dues, with complete payment history including their previous fee payments and pocket money transactions.

## How It Works

### 1. Student Exit Process
1. **Admin deletes student with outstanding dues** → Student moved to `student_exit_dues` table
2. **Student status** → Changed to "withdrawn" 
3. **Exit record created** → Contains pending fee and pocket money amounts
4. **Student appears in Student Dues** → Shows as "Exit Due" with special styling

### 2. Payment Process for Exit Dues
1. **User clicks "Pay" on exit due** → Opens PayDueModal
2. **Payment submitted** → `addExitDuePayment()` function processes payment
3. **System creates regular dues** → Converts exit due amounts to payable student_dues entries
4. **Payment applied** → Uses existing payment system to record payments
5. **Exit due updated** → Reduces pending amounts in student_exit_dues table

### 3. Payment History for Exit Dues
1. **User clicks "History" on exit due** → Opens DuePaymentHistoryModal
2. **System fetches complete history**:
   - Previous fee payments from `fee_payments` table
   - Previous pocket money transactions from `pocket_money_transactions` table  
   - New due payments from `student_due_payments` table
3. **Combined history displayed** → Chronological order with payment type badges

## Technical Implementation

### Database Changes
- **exit-due-payment-system.sql**: Creates payment functions and tables
- **student_due_payments table**: Stores payments for individual dues
- **add_student_due_payment function**: Processes individual due payments

### Frontend Changes

#### 1. StudentDuesPage.jsx
- **Combined data display**: Shows both regular dues and exit dues
- **Visual distinction**: Exit dues have amber styling and "🚪 Exit Due" badge
- **Full functionality**: Pay and History buttons work for exit dues
- **Payment handler**: `handlePaymentSubmit()` detects exit dues and uses special logic
- **History handler**: `handleViewHistory()` fetches complete payment history for exit dues

#### 2. DuePaymentHistoryModal.jsx
- **Mixed payment types**: Displays fee payments, pocket money, and due payments
- **Payment type badges**: Visual indicators for different payment sources
- **Unified display**: All payments shown in chronological order

#### 3. studentDues.api.js
- **addExitDuePayment()**: New function to handle exit due payments
- **Conversion logic**: Converts exit due amounts to regular student_dues entries
- **Payment processing**: Uses existing payment system for consistency

## Payment Flow for Exit Dues

### Step-by-Step Process:
1. **Exit due payment initiated** → `addExitDuePayment(exitDueId, paymentData)`
2. **Fetch exit due details** → Get pending amounts from `student_exit_dues`
3. **Create student_dues entries**:
   - Fee due entry (if pending fee > 0)
   - Pocket money due entry (if pending pocket money < 0)
4. **Apply payments** → Use `addDuePayment()` for each created due
5. **Update exit due record** → Reduce pending amounts
6. **Return results** → Payment confirmation and remaining balances

### Payment Allocation Logic:
```javascript
// Fee payment (if pending fee exists and payment available)
if (exitDue.pending_fee_paise > 0 && remainingPayment > 0) {
  const feePayment = Math.min(remainingPayment, exitDue.pending_fee_paise)
  // Create fee due entry and pay it
}

// Pocket money payment (if negative pocket money and payment remaining)
if (exitDue.pending_pocket_money_paise < 0 && remainingPayment > 0) {
  const pocketPayment = Math.min(remainingPayment, Math.abs(exitDue.pending_pocket_money_paise))
  // Create pocket money due entry and pay it
}
```

## Visual Features

### Exit Due Styling
- **Amber background**: `bg-amber-50 dark:bg-amber-900/10`
- **Exit Due badge**: "🚪 Exit Due" with amber colors
- **Exit reason display**: Shows why student left
- **Same functionality**: Pay and History buttons work identically to regular dues

### Payment History Display
- **Payment type badges**: 
  - Blue: "Fee Payment" (from fee_payments table)
  - Purple: "Pocket Money" (from pocket_money_transactions table)
  - Green: "Due Payment" (from student_due_payments table)
- **Chronological order**: All payments sorted by date (newest first)
- **Complete information**: Amount, date, method, reference, notes, recorded by

## Database Setup Required

Run the following SQL files in order:
1. **fix-student-exit-system-complete.sql** - Fixes constraints and RLS policies
2. **exit-due-payment-system.sql** - Creates payment functions and tables

## Testing the System

### 1. Test Exit Due Creation
- Find student with pending fees/negative pocket money
- Delete student → Choose "Move to Student Dues"
- Verify student appears in Student Dues with amber styling

### 2. Test Payment Functionality
- Click "Pay" on exit due → Should open payment modal
- Submit payment → Should process successfully
- Verify amounts are reduced in the exit due display

### 3. Test Payment History
- Click "History" on exit due → Should show complete payment history
- Verify it includes previous fee payments and pocket money transactions
- Check payment type badges are displayed correctly

## Benefits

1. **Seamless Integration**: Exit dues work exactly like regular dues
2. **Complete History**: Shows all student financial activity in one place
3. **Consistent UX**: Same payment flow for all due types
4. **Audit Trail**: Full tracking of all payments and transactions
5. **Visual Clarity**: Clear distinction between regular and exit dues
6. **Data Integrity**: Uses existing payment system for consistency

The system now provides a complete solution for managing students who have left the school but still have outstanding financial obligations, with full payment processing and historical tracking capabilities.