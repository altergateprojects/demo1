# Teacher Salary System - Quick Start Guide

## 🚀 Setup (One-Time)

### Step 1: Run Database Schema
1. Open Supabase SQL Editor
2. Copy and paste the contents of `complete-salary-system-schema.sql`
3. Click "Run" to create all tables and functions

### Step 2: Verify Setup
The system will create:
- ✅ `teacher_salary_payments` table
- ✅ `teacher_payment_reminders` table
- ✅ `teacher_advances` table
- ✅ Enhanced `teacher_bonuses` table
- ✅ Enhanced `teacher_salary_history` table
- ✅ Database functions for payment status
- ✅ RLS policies for security

## 📋 How to Use

### Record Monthly Salary Payment

1. **Navigate to Salary Page**
   - Click "Salary" in the sidebar
   - Or go to `/salary` in the URL

2. **Select Month**
   - Use the month selector to choose the payment month
   - Default is current month

3. **Find Teacher**
   - Use search box to find teacher by name or subject
   - Or filter by status (Paid/Pending/Overdue)

4. **Record Payment**
   - Click "Pay Salary" button next to teacher name
   - Fill in payment details:
     - Payment date (when payment was made)
     - Payment method (Bank Transfer, Cash, UPI, etc.)
     - Reference number (for non-cash payments)
     - Base salary (pre-filled with current salary)
   
5. **Add Breakdown (Optional)**
   - Click "Show Breakdown" to add:
     - **Allowances:** HRA, DA, TA, Other
     - **Deductions:** PF, ESI, TDS, Loan, Other
     - **Working Days:** For pro-rata calculation
   
6. **Review & Submit**
   - Check the payment summary
   - Verify net salary amount
   - Click "Record Payment"

### Add Teacher Bonus

1. **From Salary Page**
   - Find teacher in the list
   - Click "Add Bonus" button

2. **Fill Bonus Details**
   - Select bonus type (Performance, Festival, Annual, etc.)
   - Enter amount
   - Select bonus date
   - Add reason (required)
   - Add description (optional)

3. **Submit**
   - Review bonus summary
   - Click "Add Bonus"

### Update Teacher Salary

1. **From Teacher Detail Page**
   - Navigate to teacher detail page
   - Click "Update Salary" button

2. **Fill Details**
   - Select change type (Increment/Decrement/Adjustment)
   - Enter new salary amount
   - Select effective date
   - Add reason for change

3. **Submit**
   - Review salary change summary
   - Click "Update Salary"

## 💡 Key Features

### Summary Dashboard
- **Total Teachers** - Count of active teachers
- **Paid** - Teachers paid this month + total amount
- **Pending** - Teachers awaiting payment + total amount
- **Overdue** - Teachers with overdue payments

### Payment Status
- 🟢 **Paid** - Payment recorded
- 🟡 **Pending** - Not yet paid, not overdue
- 🔴 **Overdue** - Past due date, needs attention

### Filters
- **Month Selector** - View any month's payments
- **Status Filter** - Filter by payment status
- **Search** - Find teachers by name or subject

## 🔒 Security Features

### Fraud-Proof Design
- All amounts in paise (smallest unit)
- Cannot record duplicate payments
- Complete audit trail
- User tracking for all actions
- Cancellation requires reason

### Access Control
- Only Admin and Finance roles can record payments
- All users can view payment data
- RLS policies enforce security

## 📊 Payment Methods

1. **Bank Transfer** - Most common for salary
2. **Cash** - Direct cash payment
3. **UPI** - UPI payment
4. **NEFT** - National Electronic Funds Transfer
5. **RTGS** - Real Time Gross Settlement
6. **Cheque** - Cheque payment
7. **DD** - Demand Draft

## 🇮🇳 Indian School Features

### Allowances
- **HRA** - House Rent Allowance
- **DA** - Dearness Allowance
- **TA** - Transport Allowance

### Deductions
- **PF** - Provident Fund (retirement)
- **ESI** - Employee State Insurance (health)
- **TDS** - Tax Deducted at Source (income tax)

## 📝 Best Practices

### Recording Payments
1. ✅ Record on the same day payment is made
2. ✅ Always add reference numbers for non-cash
3. ✅ Use notes for special circumstances
4. ✅ Verify amounts before recording
5. ✅ Double-check payment method

### Managing Bonuses
1. ✅ Add clear reasons
2. ✅ Use appropriate bonus types
3. ✅ Document special bonuses in notes

### Salary Updates
1. ✅ Always provide reason
2. ✅ Set correct effective date
3. ✅ Document special circumstances

## 🎯 Common Workflows

### Monthly Salary Run
1. Select current month
2. Filter by "Pending" status
3. Record payments for all teachers
4. Verify all are marked "Paid"

### Year-End Bonuses
1. Navigate to Salary page
2. Click "Add Bonus" for each teacher
3. Select "Annual" bonus type
4. Enter amount and reason
5. Submit

### Salary Increment
1. Go to teacher detail page
2. Click "Update Salary"
3. Select "Increment" type
4. Enter new salary
5. Add reason (e.g., "Annual increment")
6. Submit

## 🔍 Viewing History

### Payment History
- Go to teacher detail page
- Scroll to "Salary History" section
- View all salary revisions

### Bonus History
- Go to teacher detail page
- Scroll to "Bonuses & Incentives" section
- View all bonuses received

## ⚠️ Important Notes

1. **One Payment Per Month** - Cannot record duplicate payments for same month
2. **Cannot Delete** - Payments cannot be deleted, only cancelled with reason
3. **Audit Trail** - All actions are logged with user and timestamp
4. **Academic Year** - Payments are linked to academic year automatically
5. **Due Dates** - Based on teacher's joining date (flexible per teacher)

## 🆘 Troubleshooting

### Payment Not Showing
- ✓ Check correct month is selected
- ✓ Verify payment was saved successfully
- ✓ Ensure teacher is active

### Cannot Record Payment
- ✓ Verify you have admin/finance role
- ✓ Check if payment already exists for that month
- ✓ Ensure all required fields are filled

### Bonus Not Appearing
- ✓ Check academic year filter
- ✓ Verify bonus was saved
- ✓ Refresh the page

## 📚 Additional Resources

- **Full Documentation:** `SALARY_MANAGEMENT_COMPLETE.md`
- **Database Schema:** `complete-salary-system-schema.sql`
- **System Documentation:** `TEACHER_SALARY_MANAGEMENT_SYSTEM.md`

## 🎉 You're Ready!

The salary system is now fully functional. Start by:
1. Running the database schema
2. Navigating to `/salary` page
3. Recording your first payment

---

**Need Help?** Check the full documentation or contact your system administrator.
