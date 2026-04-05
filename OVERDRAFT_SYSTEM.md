# Pocket Money Overdraft System

## Overview
The pocket money system now supports overdrafts, allowing students to spend money even when their balance is zero or insufficient. This creates a negative balance that can be paid back later.

## How It Works

### 1. Database Changes
- Removed constraints that prevented negative pocket money balances
- Updated trigger functions to allow negative balances
- Modified transaction recording to support overdrafts

### 2. API Changes
- `recordPocketMoneyTransaction` function now allows negative balances
- Enhanced logging for overdraft transactions
- Proper audit trail with overdraft information

### 3. UI Changes
- **PocketMoneyModal**: 
  - Removed validation that blocked overdraft transactions
  - Shows overdraft warning instead of error
  - Displays balance preview with overdraft indicator
- **StudentDetailPage**: 
  - Negative balances shown in red color
  - "(Overdraft)" indicator for negative balances
- **TransactionHistoryModal**: 
  - Negative balance after transactions highlighted in red
  - Overdraft indicators in transaction history

## Usage Flow

1. **Student has ₹0 balance**
2. **Staff tries to debit ₹50**
3. **System allows transaction** (creates overdraft)
4. **Student balance becomes -₹50** (shown in red)
5. **Later, staff adds ₹100 credit**
6. **Student balance becomes ₹50** (positive again)

## Visual Indicators

- **Negative balances**: Red color with "(Overdraft)" label
- **Overdraft warnings**: Orange warning box in transaction modal
- **Transaction history**: Balance after transaction shows overdraft status

## Database Script
Run `allow-negative-pocket-money.sql` to enable overdrafts in the database.

## Benefits
- Students can make purchases even with insufficient balance
- School can track who owes money
- Flexible payment system for emergency situations
- Clear audit trail of all overdraft transactions