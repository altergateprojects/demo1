# Teacher Salary Management System

## Overview
Comprehensive salary management system for teachers with individual salary tracking, salary history, bonus management, and complete audit trails.

## 🎯 Key Features

### 💰 Individual Salary Management
- **Custom Salaries**: Each teacher can have their own unique salary amount
- **Salary History**: Complete tracking of all salary changes over time
- **Effective Dates**: Track when salary changes take effect
- **Change Reasons**: Document why salaries were changed (increment, decrement, adjustment)

### 🎁 Bonus System
- **Multiple Bonus Types**: Performance, Festival, Annual, Special, Other
- **Flexible Amounts**: Any bonus amount can be assigned
- **Status Tracking**: Pending, Approved, Paid, Cancelled
- **Detailed Records**: Reason, description, and notes for each bonus

### 📊 Salary Tracking
- **Payment Records**: Track monthly salary payments
- **Payment Methods**: Cash, Bank Transfer, Cheque, UPI
- **Payment Status**: Pending, Paid, Cancelled
- **Reference Numbers**: Track payment references

### 🔍 Audit & Reporting
- **Complete Audit Trail**: All salary changes logged with user information
- **Salary History**: View all historical salary changes
- **Bonus History**: Track all bonuses given to teachers
- **Payment History**: Complete payment tracking

## 📁 File Structure

```
src/
├── api/
│   └── teacherSalary.api.js         # Salary management API functions
├── hooks/
│   └── useTeacherSalary.js          # React Query hooks for salary operations
├── components/shared/
│   ├── SalaryUpdateModal.jsx        # Modal for updating teacher salary
│   └── BonusModal.jsx               # Modal for adding teacher bonuses
└── pages/Teachers/
    ├── AddTeacherPage.jsx           # Updated with salary fields
    └── TeacherDetailPage.jsx        # Updated with salary management
```

## 🗄️ Database Schema

### Teachers Table (Updated)
```sql
ALTER TABLE teachers 
ADD COLUMN current_salary_paise BIGINT DEFAULT 0,
ADD COLUMN salary_effective_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN salary_notes TEXT;
```

### Teacher Salary History
```sql
CREATE TABLE teacher_salary_history (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  academic_year_id UUID REFERENCES academic_years(id),
  old_salary_paise BIGINT,
  new_salary_paise BIGINT NOT NULL,
  effective_date DATE NOT NULL,
  change_reason TEXT,
  change_type TEXT CHECK (change_type IN ('initial', 'increment', 'decrement', 'adjustment')),
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Teacher Bonuses
```sql
CREATE TABLE teacher_bonuses (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  academic_year_id UUID REFERENCES academic_years(id),
  bonus_type TEXT CHECK (bonus_type IN ('performance', 'festival', 'annual', 'special', 'other')),
  amount_paise BIGINT NOT NULL,
  bonus_date DATE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Teacher Salary Payments
```sql
CREATE TABLE teacher_salary_payments (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  academic_year_id UUID REFERENCES academic_years(id),
  salary_month DATE NOT NULL,
  base_salary_paise BIGINT NOT NULL,
  bonus_amount_paise BIGINT DEFAULT 0,
  deduction_amount_paise BIGINT DEFAULT 0,
  total_amount_paise BIGINT NOT NULL,
  payment_date DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  reference_number TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 API Functions

### Core Salary Operations
- `getTeacherSalaryHistory(teacherId)` - Get salary change history
- `createSalaryHistory(salaryData)` - Record salary change
- `getTeacherSalarySummary(teacherId)` - Get salary summary

### Bonus Operations
- `getTeacherBonuses(teacherId, academicYearId)` - Get teacher bonuses
- `createTeacherBonus(bonusData)` - Add new bonus
- `updateTeacherBonus(bonusId, updates)` - Update bonus status

### Payment Operations
- `getTeacherSalaryPayments(teacherId, academicYearId)` - Get payment history
- `createSalaryPayment(paymentData)` - Record salary payment

### Statistics
- `getSalaryStatistics(academicYearId)` - Get salary statistics for dashboard

## 🎨 UI Components

### SalaryUpdateModal
- **Purpose**: Update teacher salary with change tracking
- **Features**: 
  - Change type selection (increment/decrement/adjustment)
  - Effective date selection
  - Reason and notes fields
  - Salary change preview
  - Automatic history recording

### BonusModal
- **Purpose**: Add bonuses to teachers
- **Features**:
  - Bonus type selection (performance, festival, annual, special, other)
  - Flexible amount input
  - Date selection
  - Reason and description fields
  - Bonus preview

## 🔐 Security & Permissions

### Role-Based Access
- **Admin**: Full access to all salary operations
- **Finance**: Full access to salary and bonus management
- **Staff**: Read-only access to basic teacher information

### Row Level Security (RLS)
- All salary tables protected with RLS policies
- Only authorized users can view/modify salary data
- Complete audit trail for all operations

## 🚀 Usage Examples

### Adding Teacher with Salary
1. Navigate to `/teachers/add`
2. Fill in teacher information
3. Set initial monthly salary in "Salary Information" section
4. Submit form
5. Initial salary record automatically created in history

### Updating Teacher Salary
1. Go to teacher detail page
2. Click "Update Salary" button
3. Select change type (increment/decrement/adjustment)
4. Enter new salary amount
5. Set effective date and reason
6. Submit to create salary history record

### Adding Teacher Bonus
1. Go to teacher detail page
2. Click "Add Bonus" button
3. Select bonus type
4. Enter bonus amount and date
5. Provide reason and description
6. Submit to create bonus record

### Viewing Salary History
- Teacher detail page shows recent salary changes
- Complete history available with change types, dates, and reasons
- All changes tracked with user information

## 📈 Dashboard Integration

### Salary Statistics
- Total salary expenses for academic year
- Total bonuses paid
- Pending salary payments count
- Monthly salary trends

### Teacher Summary View
- Current salary display
- Recent salary changes
- Bonus summary
- Payment status

## 🔄 Automated Features

### Salary History Trigger
- Automatically updates teacher's current salary when history record is added
- Maintains data consistency across tables

### Audit Logging
- All salary operations logged to audit_logs table
- User information captured for all changes
- Detailed descriptions of all operations

## 📋 Setup Instructions

### 1. Database Setup
```sql
-- Run the teacher-salary-schema.sql script
-- This creates all necessary tables, indexes, and triggers
```

### 2. Update Teachers Schema
```sql
-- Run update-teachers-schema.sql to add salary fields to teachers table
```

### 3. Verify Installation
- Check that all tables are created
- Verify RLS policies are in place
- Test salary operations with admin user

## 🎯 Benefits

### For School Administration
- **Individual Control**: Set unique salaries for each teacher
- **Complete Tracking**: Full history of all salary changes
- **Bonus Flexibility**: Easy bonus management for any occasion
- **Audit Compliance**: Complete audit trail for financial records

### For Finance Team
- **Payment Tracking**: Record and track all salary payments
- **Reporting**: Comprehensive salary and bonus reports
- **Budget Planning**: Historical data for budget planning
- **Compliance**: Detailed records for audits

### For Teachers
- **Transparency**: Clear salary history and bonus records
- **Recognition**: Bonus system for performance and special occasions
- **Documentation**: Proper documentation of all salary changes

## 🔮 Future Enhancements

### Planned Features
- **Salary Templates**: Predefined salary structures by role/experience
- **Automatic Increments**: Scheduled annual increments
- **Payroll Integration**: Direct integration with payroll systems
- **Tax Calculations**: Automatic tax deduction calculations
- **Salary Slips**: Generate digital salary slips
- **Bulk Operations**: Bulk salary updates and bonus assignments

### Advanced Features
- **Performance-Based Bonuses**: Link bonuses to performance metrics
- **Salary Comparison**: Compare salaries across similar roles
- **Budget Alerts**: Alerts when salary expenses exceed budget
- **Export Features**: Export salary data to accounting systems

The Teacher Salary Management System is now fully integrated and ready for production use!