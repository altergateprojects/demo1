# 📍 Where to Find New Features

## 🎯 **Complete Setup Guide**

### **Initial Setup (Run Once)**

1. **Auto-Create User Profiles**: `auto-create-user-profiles.sql`
   - Creates profiles automatically for new users
   - Sets up your current user as admin
   - No need to manually add users anymore!

2. **Fix RLS Policies**: `simple-rls-fix.sql`
   - Fixes data visibility issues
   - Run if you can't see your data in the UI

3. **Check Your Data**: `show-my-data.sql`
   - Shows all your existing data
   - Useful for debugging

---

## 💰 **Fee Management System**

### **Location**: `/fees` or click "Fees" in sidebar

### **Features**:
- **Fee Configurations**: Set fees by academic year, standard, and gender
- **Multi-Year Support**: Different fees for different academic years
- **Auto-Sync**: Student fees update automatically when you change configurations
- **Reports**: Collection summary and monthly trends

### **Key Files**:
- Page: `src/pages/Fees/FeesListPageNew.jsx`
- Modal: `src/components/shared/AddFeeConfigModal.jsx`
- API: `src/api/fees.api.js`
- Hooks: `src/hooks/useFees.js`

### **How to Use**:
1. Click "Add Fee Configuration"
2. Select academic year, standard, gender
3. Enter annual fee amount
4. Click "Add Configuration"
5. Student fees update automatically!

---

## 👨‍🎓 **Student Dues Management**

### **Location**: `/students/dues` or Students → Dues in sidebar

### **Features**:
- Track previous year dues
- Manage student promotions with pending dues
- Handle exit dues for students who left
- Bulk operations for clearing dues

### **Key Files**:
- Page: `src/pages/Students/StudentDuesPage.jsx`
- API: `src/api/studentDues.api.js`
- Hooks: `src/hooks/useStudentDues.js`
- Schema: `student-dues-management-schema.sql`

### **Documentation**: `STUDENT_DUES_SYSTEM.md`

---

## 💸 **Fraud-Proof Expense System**

### **Location**: `/expenses`

### **Features**:
- Complete audit trail for all changes
- Immutable expense records
- Change tracking with before/after values
- Receipt upload support
- Approval workflow

### **Key Files**:
- List: `src/pages/Expenses/ExpensesListPage.jsx`
- Detail: `src/pages/Expenses/ExpenseDetailPage.jsx`
- Edit: `src/pages/Expenses/EditExpensePage.jsx`
- Audit: `src/pages/Expenses/ExpenseAuditPage.jsx`
- Modals: `src/components/shared/AddExpenseModal.jsx`, `EditExpenseModal.jsx`
- API: `src/api/expenses.api.js`
- Schema: `fraud-proof-expenses-schema.sql`

### **Documentation**: `FRAUD_PROOF_EXPENSE_SYSTEM.md`

---

## 👨‍🏫 **Teacher Salary System**

### **Location**: `/teachers`

### **Features**:
- Monthly salary management
- Bonus tracking
- Salary history
- Payment records

### **Key Files**:
- List: `src/pages/Teachers/TeachersListPage.jsx`
- Detail: `src/pages/Teachers/TeacherDetailPage.jsx`
- API: `src/api/teacherSalary.api.js`
- Hooks: `src/hooks/useTeacherSalary.js`
- Schema: `teacher-salary-schema.sql`

### **Documentation**: `TEACHER_SALARY_SYSTEM.md`

---

## 📊 **Reports**

### **Location**: `/reports`

### **Available Reports**:
- Collection Summary Report
- Monthly Collection Trends

### **Key Files**:
- Page: `src/pages/Reports/ReportsPage.jsx`
- API: `src/api/reports.api.js`
- Hooks: `src/hooks/useReports.js`

---

## 🔧 **Troubleshooting**

### **Common Issues**:

1. **No data showing**: Run `simple-rls-fix.sql`
2. **No user profile**: Run `auto-create-user-profiles.sql`
3. **Duplicate key errors**: Data already exists, try editing instead
4. **Database not connected**: Check `.env.local` file

### **Helpful Scripts**:
- `show-my-data.sql` - See all your data
- `test-database-connection.sql` - Test database setup
- `TROUBLESHOOTING_GUIDE.md` - Complete troubleshooting guide

---

## 🚀 **Quick Start Checklist**

- [ ] Run `auto-create-user-profiles.sql` (one-time setup)
- [ ] Run `simple-rls-fix.sql` (fix data visibility)
- [ ] Refresh browser completely
- [ ] Navigate to Fee Management
- [ ] Add your first fee configuration
- [ ] Check Students page to see data
- [ ] Explore other features!

---

## 📝 **Notes**

- All money values are stored in paise (₹1 = 100 paise) for precision
- All financial operations are fraud-proof with audit trails
- User profiles are now created automatically on signup
- RLS policies control data access
- Fee configurations automatically update student pending fees

---

## 🆘 **Need Help?**

Check these files:
- `TROUBLESHOOTING_GUIDE.md` - Detailed troubleshooting
- `QUICK_SETUP_GUIDE.md` - Quick setup instructions
- `README.md` - Project overview

Or run `show-my-data.sql` to see what you have!