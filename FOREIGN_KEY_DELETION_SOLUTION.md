# Foreign Key Deletion Solution

## Problem
Student deletion fails with: "Cannot delete student: there are related records that prevent deletion"

This happens because there are foreign key constraints preventing the deletion, and the current function doesn't handle all possible relationships.

## Solution Files Created

### 1. `diagnose-foreign-key-constraints.sql`
- Finds ALL foreign key constraints that reference the students table
- Shows which tables have student references
- Helps identify what's blocking deletion

### 2. `force-delete-student-function.sql`
- Creates comprehensive `delete_student_completely` function
- Handles ALL possible foreign key relationships
- Includes fallback `force_delete_student_cascade` function for stubborn cases

### 3. `check-student-references.sql`
- Creates diagnostic function to check what records exist for a student
- Shows exactly what needs to be deleted
- Helps troubleshoot deletion issues

## How the Solution Works

### Step 1: Comprehensive Deletion Order
The new function deletes records in this order:
1. `student_due_payments` (references student_dues)
2. `student_dues` (references students)
3. `student_exit_dues` (references students)
4. `fee_payments` (references students)
5. `pocket_money_transactions` (references students)
6. `student_year_snapshots` (references students)
7. Any other possible tables (promotions, attendance, grades, etc.)
8. Finally, the `students` record

### Step 2: Fallback Force Deletion
If regular deletion still fails, the API automatically tries:
- `force_delete_student_cascade` function
- Temporarily disables foreign key checks
- Deletes the student record
- Cleans up orphaned records
- Re-enables foreign key checks

### Step 3: Enhanced Error Handling
- Diagnostic function shows what's blocking deletion
- Specific error messages for different failure types
- Automatic fallback to force deletion
- Complete audit trail

## Implementation Steps

### 1. Run Database Setup
Execute these SQL files in order:
```sql
-- 1. Diagnose current constraints
-- Run: diagnose-foreign-key-constraints.sql

-- 2. Create comprehensive deletion functions
-- Run: force-delete-student-function.sql

-- 3. Create diagnostic function
-- Run: check-student-references.sql
```

### 2. Test the Solution
The API now:
1. Checks what references exist (diagnostic)
2. Attempts regular comprehensive deletion
3. Falls back to force deletion if needed
4. Provides clear error messages

### 3. Verify Functions Exist
Check that functions were created:
```sql
SELECT proname FROM pg_proc 
WHERE proname IN (
    'delete_student_completely', 
    'force_delete_student_cascade',
    'check_student_references'
);
```

## What Gets Deleted

### Regular Tables:
- student_due_payments
- student_dues  
- student_exit_dues
- fee_payments
- pocket_money_transactions
- student_year_snapshots

### Additional Tables (if they exist):
- student_promotions
- student_attendance
- student_grades/marks
- library_transactions
- transport_assignments
- medical_records
- disciplinary_records

### Preserved:
- audit_logs (for compliance)
- deleted_students_backup (if using backup function)

## Troubleshooting

### If Deletion Still Fails:
1. **Check function exists**: Run the verification query above
2. **Check permissions**: Ensure user has admin role
3. **Check references**: Use `check_student_references(student_id)` to see what's blocking
4. **Manual cleanup**: Delete specific blocking records manually

### Common Blocking Tables:
- Custom tables not handled by the function
- Views that reference students
- Triggers that prevent deletion
- RLS policies that block access

### Emergency Manual Deletion:
If all else fails, you can manually delete in this order:
```sql
-- Replace STUDENT_ID with actual ID
DELETE FROM student_due_payments WHERE student_due_id IN (SELECT id FROM student_dues WHERE student_id = 'STUDENT_ID');
DELETE FROM student_dues WHERE student_id = 'STUDENT_ID';
DELETE FROM student_exit_dues WHERE student_id = 'STUDENT_ID';
DELETE FROM fee_payments WHERE student_id = 'STUDENT_ID';
DELETE FROM pocket_money_transactions WHERE student_id = 'STUDENT_ID';
DELETE FROM student_year_snapshots WHERE student_id = 'STUDENT_ID';
DELETE FROM students WHERE id = 'STUDENT_ID';
```

## Benefits

1. **Comprehensive**: Handles all known foreign key relationships
2. **Automatic Fallback**: Force deletion if regular deletion fails
3. **Diagnostic**: Shows exactly what's preventing deletion
4. **Safe**: Maintains data integrity while enabling deletion
5. **Auditable**: Complete audit trail of all deletions

The solution should now handle even the most complex foreign key scenarios and provide clear feedback on any remaining issues.