# Student Deletion System Fixes

## Issues Fixed

### 1. Students List Page - Withdrawn Students Still Showing
**Problem**: Students marked as "withdrawn" were still appearing in the default Students List view.

**Solution**: 
- Modified `src/api/students.api.js` in both `getStudents()` and `getStudentsBasic()` functions
- Added logic to exclude withdrawn students by default unless specifically filtering for them
- Updated Students List Page filter dropdown to clarify behavior:
  - Default: "Active Students (Default)" - excludes withdrawn
  - Added "All Students" option to show everything including withdrawn
  - Individual status filters (active, suspended, withdrawn, alumni) work as expected

### 2. Student Dues Page - Exit Dues Not Showing
**Problem**: Students moved to dues via the deletion modal were going to `student_exit_dues` table but the Student Dues Page only read from `student_dues` table.

**Solution**:
- Modified `src/pages/Students/StudentDuesPage.jsx` to fetch both regular dues and exit dues
- Added `useStudentExitDues` hook import and usage
- Combined both data sources in the pending dues display
- Exit dues are visually distinguished with:
  - Amber background color
  - "🚪 Exit Due" badge
  - "Contact for Payment" action instead of payment buttons
  - Shows exit reason in the student info

### 3. Database Constraint Error
**Problem**: `student_exit_dues_exit_reason_check` constraint was causing insertion failures.

**Solution**:
- Created `fix-student-exit-system-complete.sql` to:
  - Remove all problematic constraints on `exit_reason` column
  - Recreate with simple not-empty constraint
  - Fix RLS policies to avoid conflicts
  - Grant proper permissions

## Files Modified

### Frontend Changes
1. **src/api/students.api.js**
   - Updated status filtering logic in `getStudents()` and `getStudentsBasic()`
   - Added support for "all" status filter

2. **src/pages/Students/StudentsListPage.jsx**
   - Updated status filter dropdown options
   - Clarified default behavior in UI

3. **src/pages/Students/StudentDuesPage.jsx**
   - Added `useStudentExitDues` hook
   - Combined regular dues and exit dues in display
   - Added visual distinction for exit dues
   - Updated tab counts to include exit dues

### Database Changes
4. **fix-student-exit-system-complete.sql**
   - Removes problematic constraints
   - Fixes RLS policies
   - Grants proper permissions

## How It Works Now

### Student Deletion Flow
1. **Admin clicks "Delete Student"** → DeleteStudentModal opens
2. **Dues Check**: Modal detects if student has outstanding dues
3. **If Outstanding Dues**:
   - Shows warning with breakdown of amounts
   - Recommends moving to Student Dues section
   - Provides exit reason dropdown
   - "Move to Student Dues" button calls `recordStudentExitWithDues()`
4. **Student Status Update**: Student marked as `status = 'withdrawn'`
5. **Exit Record Created**: Entry added to `student_exit_dues` table
6. **List Updates**: Student disappears from default Students List view

### Student Dues Display
1. **Pending Dues Tab** now shows:
   - Regular student dues from `student_dues` table
   - Exit dues from `student_exit_dues` table (with special styling)
   - Combined count in tab badge
2. **Exit dues are visually distinct**:
   - Amber background and border
   - "🚪 Exit Due" badge
   - Shows exit reason
   - "Contact for Payment" instead of payment buttons

### Students List Filtering
1. **Default View**: Shows only active students (excludes withdrawn)
2. **Status Filters**:
   - "Active Students (Default)" - excludes withdrawn
   - "Active Only" - only active status
   - "Withdrawn" - only withdrawn students
   - "All Students" - shows everything
3. **Withdrawn students can be viewed** by selecting "Withdrawn" or "All Students" filter

## Testing the Fix

1. **Test Student Deletion with Dues**:
   - Find a student with pending fees or negative pocket money
   - Click "Delete Student"
   - Choose "Move to Student Dues"
   - Verify student disappears from default list
   - Check Student Dues page shows the exit due

2. **Test Filtering**:
   - Default view should not show withdrawn students
   - "Withdrawn" filter should show only withdrawn students
   - "All Students" filter should show everything

3. **Test Database Constraint**:
   - Run the SQL fix if constraint errors occur
   - Retry student deletion process

## Database Setup Required

If you encounter constraint errors, run this SQL:

```sql
-- Run fix-student-exit-system-complete.sql
-- This removes problematic constraints and fixes RLS policies
```

The system now properly handles the complete student exit workflow with proper data separation and visual distinction between regular dues and exit dues.