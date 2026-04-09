# Teacher Salary Management System

## Overview
Complete salary management system for Indian private schools with audit trail, payment recording, bonus management, and automated reminders.

## Features

### 1. Salary Payment Recording
- Record monthly salary payments for each teacher
- Each teacher has their own payment cycle based on joining date
- Flexible payment date selection
- Payment method tracking (Cash, Bank Transfer, Cheque, UPI, etc.)
- Receipt number generation
- Notes for each payment

### 2. Bonus Management
- Add performance bonuses
- Festival bonuses (Diwali, Holi, etc.)
- Incentives for achievements
- One-time payments
- Bonus history tracking

### 3. Salary Structure
- Base salary (monthly)
- Allowances (HRA, DA, TA, etc.)
- Deductions (PF, ESI, TDS, etc.)
- Net salary calculation
- Salary revision history

### 4. Payment Reminders
- Monthly reminders for pending salary payments
- Customizable reminder dates
- Teacher-wise payment due tracking
- Overdue payment alerts

### 5. Audit Trail
- Complete payment history
- Who paid, when, how much
- Payment method tracking
- Receipt numbers
- Modification history

### 6. Indian School Specific Features
- PF (Provident Fund) tracking
- ESI (Employee State Insurance) tracking
- TDS (Tax Deducted at Source) calculation
- Gratuity calculation
- Leave encashment
- Bonus as per Payment of Bonus Act
- Festival advances

## Database Schema

### Tables:
1. `teachers` - Teacher master data with current_salary_paise
2. `teacher_salary_history` - Salary revision history
3. `teacher_salary_payments` - Monthly salary payment records
4. `teacher_bonuses` - Bonus and incentive records
5. `teacher_salary_structure` - Detailed salary components (allowances, deductions)
6. `teacher_payment_reminders` - Automated reminder system

## Payment Cycle Logic

### Joining Date Based Cycle:
- Teacher joins on 15th March → Payment cycle: 15th of every month
- Teacher joins on 1st April → Payment cycle: 1st of every month
- Flexible: Admin can override and set custom payment dates

### Pro-rata Calculation:
- First month: Calculate salary based on working days
- Last month: Calculate based on working days if leaving

## Workflow

### 1. Set Base Salary (Teacher Detail Page)
- Admin sets initial salary when adding teacher
- Can update salary anytime (creates history record)

### 2. Record Monthly Payment (Salary Page)
- View all teachers with payment status
- Filter by: Pending, Paid, Overdue
- Click "Pay Salary" → Opens payment modal
- Enter: Payment date, amount, method, receipt number
- System records payment with audit trail

### 3. Add Bonus (Salary Page or Teacher Detail)
- Select teacher
- Enter bonus amount, reason, date
- Records as separate transaction
- Shows in payment history

### 4. View History (Teacher Detail Page)
- Salary revision history
- Payment history (month-wise)
- Bonus history
- Total paid in current year

## Reports

1. Monthly Salary Register
2. Yearly Salary Statement (per teacher)
3. Pending Payments Report
4. Bonus Summary Report
5. Tax Deduction Report (TDS)
6. PF/ESI Report

## Security & Audit

- All payments are immutable (cannot be deleted)
- Can only be marked as "cancelled" with reason
- Complete audit trail with user, timestamp, IP
- Role-based access (only admin/finance can record payments)
- Fraud-proof with data hashing

## Integration Points

1. **Expenses Module**: Salary payments auto-create expense records
2. **Dashboard**: Shows pending salary payments count
3. **Notifications**: Reminds admin of pending payments
4. **Reports**: Comprehensive salary reports

## Future Enhancements

1. Automated salary slip generation (PDF)
2. Email salary slips to teachers
3. SMS notifications for payment
4. Bank file generation for bulk transfers
5. Attendance-based salary calculation
6. Leave deduction automation
7. Loan/advance management
8. Income tax calculation (Form 16)
