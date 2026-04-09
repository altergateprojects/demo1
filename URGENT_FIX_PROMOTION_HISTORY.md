# URGENT FIX: Student Promotion History Constraint

## The Problem

The student deletion is failing because there's a `student_promotion_history` table that references `student_year_snapshots` via a foreign key constraint `student_promotion_history_snapshot_id_fkey`.

**Error**: `update or delete on table "student_year_snapshots" violates foreign key constraint "student_promotion_history_snapshot_id_fkey" on table "student_promotion_history"`

## The Solution

The deletion functions need to delete from `student_promotion_history` BEFORE deleting from `student_year_snapshots`.

## STEP 1: Run the Fix (CRITICAL)

**Copy and paste this into Supabase SQL Editor:**

```sql
-- Fix for student_promotion_history foreign key constraint
CREATE OR REPLACE FUNCTION delete_student_completely(
    p_student_id UUID,
    p_deletion_reason TEXT,
    p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_student RECORD;
    v_result JSON;
    v_error_details TEXT;
BEGIN
    -- Check if student exists
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;

    BEGIN
        -- Delete in proper order to handle ALL foreign key constraints
        
        -- 1. Delete student_due_payments first
        DELETE FROM student_due_payments 
        WHERE student_due_id IN (SELECT id FROM student_dues WHERE student_id = p_student_id);
        
        -- 2. Delete student_dues
        DELETE FROM student_dues WHERE student_id = p_student_id;
        
        -- 3. Delete student_exit_dues
        DELETE FROM student_exit_dues WHERE student_id = p_student_id;
        
        -- 4. Delete fee_payments
        DELETE FROM fee_payments WHERE student_id = p_student_id;
        
        -- 5. Delete pocket_money_transactions
        DELETE FROM pocket_money_transactions WHERE student_id = p_student_id;
        
        -- 6. DELETE PROMOTION HISTORY FIRST (this was missing!)
        DELETE FROM student_promotion_history 
        WHERE snapshot_id IN (SELECT id FROM student_year_snapshots WHERE student_id = p_student_id);
        
        -- 7. Delete student_year_snapshots
        DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
        
        -- 8. Delete the student record
        DELETE FROM students WHERE id = p_student_id;
        
        -- Return success
        RETURN json_build_object(
            'success', true,
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'student_roll', v_student.roll_number,
            'deletion_reason', p_deletion_reason,
            'deleted_at', NOW(),
            'message', 'Student deleted successfully'
        );
        
    EXCEPTION 
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS v_error_details = MESSAGE_TEXT;
            RAISE EXCEPTION 'Failed to delete student: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update force delete function too
CREATE OR REPLACE FUNCTION force_delete_student_cascade(
    p_student_id UUID,
    p_deletion_reason TEXT,
    p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_student RECORD;
    v_result JSON;
    v_records_deleted INTEGER := 0;
BEGIN
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;

    -- Delete in correct order
    DELETE FROM student_due_payments WHERE student_due_id IN (SELECT id FROM student_dues WHERE student_id = p_student_id);
    DELETE FROM student_dues WHERE student_id = p_student_id;
    DELETE FROM student_exit_dues WHERE student_id = p_student_id;
    DELETE FROM fee_payments WHERE student_id = p_student_id;
    DELETE FROM pocket_money_transactions WHERE student_id = p_student_id;
    
    -- CRITICAL: Delete promotion history before snapshots
    DELETE FROM student_promotion_history WHERE snapshot_id IN (SELECT id FROM student_year_snapshots WHERE student_id = p_student_id);
    DELETE FROM student_year_snapshots WHERE student_id = p_student_id;
    DELETE FROM students WHERE id = p_student_id;
    
    RETURN json_build_object(
        'success', true,
        'student_id', p_student_id,
        'message', 'Student force deleted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_student_completely TO authenticated;
GRANT EXECUTE ON FUNCTION force_delete_student_cascade TO authenticated;
```

## STEP 2: Test the Fix

1. Try deleting the student again
2. The deletion should now work properly
3. Both regular and force deletion should handle the promotion history constraint

## STEP 3: Verify (Optional)

Run this to check what records exist for a specific student:

```sql
-- Replace with actual student ID
SELECT 
    'student_promotion_history' as table_name,
    COUNT(*) as record_count
FROM student_promotion_history sph
JOIN student_year_snapshots sys ON sph.snapshot_id = sys.id
WHERE sys.student_id = '5c088761-7a14-46d7-b016-1c5cfb8112c3';
```

## What This Fixes

- ✅ Handles `student_promotion_history` table that references `student_year_snapshots`
- ✅ Deletes records in the correct order to avoid foreign key violations
- ✅ Works for both regular and force deletion
- ✅ Maintains all existing functionality

## Expected Result

After running the SQL fix:
- Student deletion will work without foreign key constraint errors
- The 3-step deletion modal will complete successfully
- PDF generation will work (separate issue, already fixed)
- Students can be moved to Student Dues section properly

The key insight is that `student_promotion_history` has records that reference `student_year_snapshots`, so we must delete from `student_promotion_history` first, then `student_year_snapshots`, then the student record itself.