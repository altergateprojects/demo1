# Student Dues System Troubleshooting

## Issue: "Failed to move student to dues"

This error occurs when trying to move a student with outstanding dues to the Student Dues section. Here are the steps to diagnose and fix the issue:

## Step 1: Check Database Setup

### 1.1 Run the Fix Function
Execute this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of fix-student-exit-with-dues-function.sql
```

### 1.2 Verify Function Exists
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'record_student_exit_with_dues';
```

### 1.3 Check Table Exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'student_exit_dues';
```

## Step 2: Test the Function

### 2.1 Find a Test Student
```sql
SELECT id, full_name, roll_number, status
FROM students 
WHERE status = 'active' 
LIMIT 1;
```

### 2.2 Test Function Call
```sql
SELECT record_student_exit_with_dues(
    'STUDENT_ID_HERE'::UUID,
    'Test exit',
    CURRENT_DATE,
    'Test notes'
);
```

## Step 3: Check Permissions

### 3.1 Verify User Profile
```sql
SELECT id, role 
FROM user_profiles 
WHERE id = auth.uid();
```

### 3.2 Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'student_exit_dues';
```

## Step 4: Common Issues & Solutions

### Issue 1: Function Not Found
**Error**: `function record_student_exit_with_dues does not exist`

**Solution**: Run `fix-student-exit-with-dues-function.sql` in Supabase SQL Editor

### Issue 2: Table Not Found
**Error**: `relation "student_exit_dues" does not exist`

**Solution**: The fix SQL file creates the table. Run it completely.

### Issue 3: Permission Denied
**Error**: `permission denied` or `RLS policy violation`

**Solution**: 
1. Check user has admin or finance role
2. Verify RLS policies are correctly set up
3. Run the fix SQL which includes proper policies

### Issue 4: Student Not Found
**Error**: `Student not found with ID: xxx`

**Solution**: 
1. Verify student ID is correct
2. Check student exists and is not already withdrawn
3. Ensure student status is 'active'

### Issue 5: Auth User Not Found
**Error**: `auth.uid() returns null`

**Solution**: 
1. User must be properly authenticated
2. Check Supabase auth session is valid
3. Verify user_profiles table has entry for user

## Step 5: Debug Mode

### Enable Console Logging
The enhanced DeleteStudentModal now includes detailed console logging. Check browser console for:

```javascript
// Look for these logs:
"Moving student to dues:" // Shows parameters being sent
"Student exit result:" // Shows database response
"Error moving student to dues:" // Shows detailed error
```

### Check Network Tab
1. Open browser DevTools → Network tab
2. Look for RPC call to `record_student_exit_with_dues`
3. Check request payload and response

## Step 6: Manual Verification

### After Successful Move
Check that the student was properly moved:

```sql
-- Check student status changed
SELECT id, full_name, status 
FROM students 
WHERE id = 'STUDENT_ID_HERE';

-- Check exit record created
SELECT * 
FROM student_exit_dues 
WHERE student_id = 'STUDENT_ID_HERE';

-- Check audit log
SELECT * 
FROM audit_logs 
WHERE entity_id = 'STUDENT_ID_HERE' 
AND action_type = 'MOVE_TO_DUES';
```

## Step 7: Alternative Solution

If the function still doesn't work, you can manually move the student:

```sql
-- 1. Create exit record manually
INSERT INTO student_exit_dues (
    student_id,
    exit_reason,
    pending_fee_paise,
    pending_pocket_money_paise,
    notes,
    student_name,
    student_roll,
    created_by
) VALUES (
    'STUDENT_ID_HERE',
    'Manual transfer',
    1000, -- pending amount in paise
    0,
    'Manually moved due to system issue',
    'Student Name',
    'Roll Number',
    auth.uid()
);

-- 2. Update student status
UPDATE students 
SET status = 'withdrawn' 
WHERE id = 'STUDENT_ID_HERE';
```

## Prevention

### Regular Maintenance
1. **Run database setup scripts** when deploying new features
2. **Test critical functions** after database changes
3. **Monitor error logs** for function failures
4. **Keep backups** of working database states

### Code Quality
1. **Add comprehensive error handling** in API calls
2. **Include detailed logging** for debugging
3. **Validate inputs** before database calls
4. **Test edge cases** with different student states

## Getting Help

If issues persist:

1. **Check Supabase logs** in dashboard
2. **Export error details** from browser console
3. **Verify database schema** matches expected structure
4. **Test with minimal data** to isolate issues

## Status Indicators

✅ **Working**: Function exists, table exists, permissions correct  
⚠️ **Partial**: Some components missing or misconfigured  
❌ **Broken**: Major components missing, needs full setup  

Run the test SQL files to determine your current status.