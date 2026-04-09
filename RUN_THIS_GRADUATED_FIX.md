# Quick Fix for Graduated Student Issue

## Error You Got
```
ERROR: 42702: column reference "id" is ambiguous
```

This happened because the original SQL had ambiguous column names. I've created a simpler version.

## Solution: Run This File

**File to run:** `fix-graduated-student-status-simple.sql`

This is a simplified version that avoids the ambiguous column error.

## How to Run

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy all content from `fix-graduated-student-status-simple.sql`
4. Paste into SQL Editor
5. Click "Run"
6. You should see: "✅ Student Status Updated"

## What It Does

1. Shows Shantya's current status
2. Updates status from 'active' to 'graduated'
3. Verifies the update worked
4. Shows active students (Shantya should NOT be here)
5. Shows graduated students (Shantya SHOULD be here)

## After Running

1. Refresh your browser
2. Go to Students list → Shantya NOT there
3. Go to Alumni page → Shantya IS there

## Optional: Add Payment Validation

After the status is updated, you can also run:
- `add-student-status-validation.sql` (prevents graduated students from receiving payments)

---

**Quick Summary:**
- Run: `fix-graduated-student-status-simple.sql`
- Refresh browser
- Done!
