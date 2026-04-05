# Student Dues - Manual Entry Feature

## What Was Added

### 1. **Add Manual Due Button**
- Located on Student Dues page (`/students/dues`)
- Opens a modal for entering historical dues
- Accessible to Finance and Admin users only

### 2. **Manual Due Entry Modal**
A comprehensive form with:
- Student selection dropdown
- Academic year selection (when due originated)
- Due type (Fee or Pocket Money)
- Amount input (in rupees)
- Due date picker
- Description/notes field
- Helpful information box explaining the feature

### 3. **Complete Functionality**
- **Add dues** from previous years
- **View pending dues** in table format
- **View cleared dues** history
- **Statistics dashboard** showing totals
- **Audit trail** for all operations

## Why This Feature is Critical

When you deploy this system to an existing school:

### Problem Without Manual Entry:
- School has been running for years
- Students have pending fees from 2022-23, 2023-24, etc.
- No way to record these historical dues
- Financial records incomplete
- Cannot track total amounts owed

### Solution With Manual Entry:
- ✅ Record all historical dues from any previous year
- ✅ Link dues to specific academic years
- ✅ Track both fee dues and pocket money dues
- ✅ Maintain complete financial history
- ✅ Clear dues when payments are received
- ✅ Generate reports on total pending amounts

## How It Works

### For System Implementation:

**Step 1: Prepare Data**
```
Student Name | Academic Year | Type | Amount | Notes
-------------|---------------|------|--------|-------
Rahul Kumar  | 2023-24      | Fee  | ₹8,000 | Pending from last year
Priya Sharma | 2022-23      | Fee  | ₹5,000 | Two years pending
Amit Patel   | 2023-24      | PM   | ₹500   | Pocket money overdraft
```

**Step 2: Enter Each Due**
1. Go to Student Dues page
2. Click "Add Manual Due"
3. Fill in the form
4. Submit

**Step 3: Verify**
- Check "Pending Dues" tab
- Review statistics
- Confirm all dues are recorded

**Step 4: Manage**
- Clear dues as payments come in
- Track who cleared what and when
- Generate reports for management

## Real-World Example

### School XYZ Scenario:
- Running since 2020
- Implementing system in 2024-25
- Has 150 students
- 45 students have pending fees from previous years
- Total historical dues: ₹3,50,000

### Implementation Process:
1. **Week 1**: Add all current students to system
2. **Week 2**: Use manual due entry to record all 45 historical dues
3. **Week 3**: Verify all dues are correct
4. **Week 4**: Start collecting and clearing dues
5. **Ongoing**: System automatically tracks new dues from promotions

### Result:
- Complete financial picture from day one
- No dues lost in transition
- Parents can see all pending amounts
- Finance team has full visibility
- Audit trail for compliance

## Key Features

### 1. **Academic Year Tracking**
- Each due is linked to the year it originated
- Can see which year the money is from
- Helps in reporting and analysis

### 2. **Due Types**
- **Fee Dues**: Unpaid annual fees
- **Pocket Money Dues**: Negative balances (overdrafts)

### 3. **Audit Trail**
- Who created the due
- When it was created
- Who cleared it (when paid)
- When it was cleared
- Payment reference (if any)

### 4. **Statistics**
- Total pending dues across all years
- Total cleared dues
- Breakdown by type
- Number of students with dues

### 5. **Bulk Operations**
- View all dues in one place
- Filter by year, type, or student
- Select multiple for clearing
- Export for reports

## Files Created/Modified

### New Files:
1. `src/components/shared/AddManualDueModal.jsx` - Modal for adding dues
2. `src/hooks/useStudentDues.js` - React hooks for due management
3. `MANUAL_DUE_ENTRY_GUIDE.md` - Detailed user guide
4. `STUDENT_DUES_MANUAL_ENTRY.md` - This summary

### Modified Files:
1. `src/pages/Students/StudentDuesPage.jsx` - Added full functionality
2. `src/api/studentDues.api.js` - Already had createStudentDue function

## Usage Instructions

### For Finance Staff:
1. Navigate to **Student Dues** from sidebar
2. Click **"+ Add Manual Due"** button
3. Fill in the form:
   - Select student
   - Select academic year (when due originated)
   - Select type (Fee or Pocket Money)
   - Enter amount
   - Add description (recommended)
4. Click **"Add Due"**
5. Due appears in "Pending Dues" tab
6. Clear when payment is received

### For Administrators:
1. Ensure all students are added to system first
2. Ensure all required academic years exist
3. Prepare list of historical dues
4. Assign finance staff to enter dues
5. Verify all dues are recorded correctly
6. Monitor statistics dashboard

## Benefits

### For Schools:
- ✅ Complete financial records from day one
- ✅ No historical data lost
- ✅ Easy migration from old systems
- ✅ Professional financial management
- ✅ Audit-ready records

### For Finance Team:
- ✅ Single source of truth for all dues
- ✅ Easy to track and manage
- ✅ Clear audit trail
- ✅ Automated calculations
- ✅ Comprehensive reporting

### For Parents:
- ✅ Transparent view of all dues
- ✅ Clear breakdown by year
- ✅ Easy payment tracking
- ✅ Historical records available

## Next Steps

1. **Database Setup**: Run `complete-student-dues-setup.sql` if not already done
2. **Test**: Add a few test dues to verify functionality
3. **Train**: Train finance staff on the feature
4. **Migrate**: Enter all historical dues
5. **Verify**: Check statistics and reports
6. **Go Live**: Start using for day-to-day operations

## Support

For questions or issues:
1. Check `MANUAL_DUE_ENTRY_GUIDE.md` for detailed instructions
2. Check `STUDENT_DUES_SYSTEM.md` for system overview
3. Review `TROUBLESHOOTING_GUIDE.md` for common issues

---

**This feature ensures that no matter when you implement the system, you can capture complete financial history and provide professional financial management from day one.**
