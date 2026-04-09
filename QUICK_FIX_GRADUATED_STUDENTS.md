# Quick Fix: Graduated Students Issue

## Problem
Graduated student "Shantya" appears in Students list and can receive payments.

## Solution (2 Steps)

### Step 1: Update Student Status
**File:** `fix-graduated-student-status.sql`

**What it does:** Changes Shantya's status from 'active' to 'graduated'

**Run in:** Supabase SQL Editor

**Result:** Shantya disappears from Students list, appears in Alumni page

---

### Step 2: Add Payment Validation
**File:** `add-student-status-validation.sql`

**What it does:** Prevents graduated students from receiving payments

**Run in:** Supabase SQL Editor

**Result:** Payment functions reject graduated students with error message

---

## How to Run

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy-paste SQL from `fix-graduated-student-status.sql`
4. Click Run
5. Copy-paste SQL from `add-student-status-validation.sql`
6. Click Run
7. Refresh your browser

## Verification

✅ Students list → Shantya NOT there
✅ Alumni page → Shantya IS there
✅ Try payment → Shows error

## Files to Run (in order)

1. `fix-graduated-student-status.sql` ← REQUIRED
2. `add-student-status-validation.sql` ← RECOMMENDED

---

**Time to fix:** 2 minutes
**Difficulty:** Easy (just copy-paste SQL)
**Risk:** None (safe to run)
