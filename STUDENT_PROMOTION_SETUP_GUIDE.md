# Student Promotion System - Setup & Usage Guide

## 🚀 Quick Setup

### Step 1: Run Database Migrations

Execute these SQL files in your Supabase SQL Editor in this order:

```sql
-- 1. Create tables and schema
\i student-promotion-schema.sql

-- 2. Create core functions
\i student-promotion-functions.sql

-- 3. Create query functions
\i student-promotion-query-functions.sql
```

Or copy and paste the contents of each file into the Supabase SQL Editor.

### Step 2: Verify Installation

The system is now ready! You should see:
- ✅ New menu item "Student Promotion" in the sidebar
- ✅ Route accessible at `/students/promotion`

## 📍 How to Access

1. **From Sidebar Menu**: Click on "Student Promotion" (appears between "Student Dues" and "Teachers")
2. **Direct URL**: Navigate to `/students/promotion` in your browser

## 🎯 Features

### 1. Student Promotion Page
- **View all students** eligible for promotion
- **Filter by**: Academic Year, Standard, Search by name/roll number
- **Select students** individually or use "Select All"
- **Bulk promotion** for multiple students at once
- **Individual promotion** with detailed options

### 2. Individual Promotion Modal
Shows when you click "Promote" button for a student:

**Student Information:**
- Name, Roll Number, Current Standard

**Financial Breakdown:**
- Fee Due
- Pocket Money (positive or negative)
- Total Pending Dues

**Promotion Options:**
- ✅ **Promoted**: Move to next standard
- ✅ **Repeated**: Stay in same standard
- ✅ **Left School**: Student is leaving
- ✅ **Graduated**: Final year completion

**Dues Handling:**
- **Carry Forward**: Track dues in next year
- **Waive**: Forgive all pending dues

**Validation:**
- Automatic checks for class mixing
- Capacity validation
- Eligibility verification

### 3. Bulk Promotion Modal
Shows when you click "Bulk Promote" with selected students:

**Features:**
- Summary of selected students
- Total pending dues calculation
- Batch name (optional)
- Common promotion action for all
- Progress tracking
- Detailed results with success/failure breakdown

### 4. Financial Tracking
The system automatically:
- ✅ Creates immutable year-end snapshots
- ✅ Tracks dues across academic years
- ✅ Handles negative pocket money
- ✅ Maintains complete audit trail
- ✅ Prevents class mixing
- ✅ Records exit dues for leaving students

## 🔐 Permissions

**Who can promote students:**
- Admin
- Finance
- Principal

**Who can view promotion history:**
- All authenticated users

## 📊 Dashboard Integration

The system adds a new "Pending Dues Summary" widget to the dashboard showing:
- Current Year Dues
- Previous Years Dues (carried forward)
- Exit Dues (from students who left)
- Total Pending

## 🔄 Workflow Example

### Promoting a Single Student

1. Go to **Students → Student Promotion**
2. Filter by current academic year and standard
3. Click **"Promote"** button for the student
4. Review financial information
5. Select promotion action (Promoted/Repeated/Left School/Graduated)
6. Choose target academic year and standard
7. Select how to handle pending dues
8. Add optional notes
9. Click **"Promote Student"**

### Bulk Promoting a Class

1. Go to **Students → Student Promotion**
2. Filter by the class you want to promote
3. Click **"Select All"** checkbox
4. Click **"Bulk Promote (X)"** button
5. Enter optional batch name
6. Select target academic year and standard
7. Choose promotion action
8. Select dues handling
9. Click **"Promote X Students"**
10. Review results showing success/failures

## ⚠️ Important Notes

### Class Mixing Prevention
- Cannot promote students to a class that already has students
- Must promote entire class together or to empty class
- System validates this automatically

### Financial Integrity
- All money values stored in paise (fraud-proof)
- Immutable audit logs (cannot be deleted or modified)
- Complete transaction history preserved
- Negative pocket money included in pending dues

### Promotion Reversal
- Can reverse promotions within same academic year
- Only if no financial transactions occurred after promotion
- Restores student to previous state
- Records reversal in audit log

## 🗄️ Database Tables Created

1. **student_year_snapshots**: Immutable financial snapshots
2. **promotion_batches**: Bulk operation tracking
3. **student_promotion_history**: Complete promotion history
4. **fee_adjustments**: Scholarships, waivers, discounts

## 🔧 Troubleshooting

### "Target class already contains students" error
- This means the target class is not empty
- Promote all students from that class first
- Or choose a different target standard

### "Student not eligible for promotion"
- Check if student has `promotion_eligible = FALSE`
- Check `promotion_hold_reason` field
- Update student record to enable promotion

### Functions not found
- Ensure all three SQL files were executed
- Check Supabase logs for errors
- Verify RLS policies are enabled

### Permission denied errors
- Check user role (must be admin/finance/principal)
- Verify RLS policies in Supabase
- Check user_profiles table has correct role

## 📈 Next Steps

After setup, you can:
1. Test with a few students first
2. Review promotion history
3. Check dashboard dues summary
4. Perform bulk promotions for entire classes
5. Generate reports from promotion_batches table

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify all SQL files were executed successfully
4. Ensure user has correct permissions

## 🎉 You're Ready!

The Student Promotion System is now fully functional. Navigate to the "Student Promotion" menu item in the sidebar to get started!
