-- 🔧 FIX DASHBOARD EXPENSES CALCULATION
-- Adds academic_year_id to expenses table and fixes the calculation

-- Step 1: Check current expenses table structure
SELECT '=== CURRENT EXPENSES TABLE STRUCTURE ===' as info;

SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'expenses'
ORDER BY ordinal_position;

-- Step 2: Add academic_year_id column if missing
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id);

-- Step 3: Update existing expenses to link to current academic year
UPDATE expenses 
SET academic_year_id = (
    SELECT id FROM academic_years WHERE is_current = true LIMIT 1
)
WHERE academic_year_id IS NULL;

-- Step 4: Show total expenses
SELECT '=== TOTAL EXPENSES CHECK ===' as info;

SELECT 
    COUNT(*) as total_expenses_count,
    SUM(CASE WHEN type = 'debit' THEN amount_paise ELSE -amount_paise END) as net_expenses_paise,
    '₹' || (SUM(CASE WHEN type = 'debit' THEN amount_paise ELSE -amount_paise END) / 100)::text as net_expenses_rupees
FROM expenses
WHERE is_deleted = false
AND is_approved = true;

-- Step 5: Show expenses by academic year
SELECT 
    '=== EXPENSES BY ACADEMIC YEAR ===' as info;

SELECT 
    COALESCE(ay.year_label, 'No Year Assigned') as academic_year,
    COUNT(*) as expense_count,
    SUM(CASE WHEN e.type = 'debit' THEN e.amount_paise ELSE -e.amount_paise END) as net_expenses_paise,
    '₹' || (SUM(CASE WHEN e.type = 'debit' THEN e.amount_paise ELSE -e.amount_paise END) / 100)::text as net_expenses_rupees
FROM expenses e
LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
WHERE e.is_deleted = false
AND e.is_approved = true
GROUP BY ay.year_label
ORDER BY ay.year_label DESC;

SELECT '✅ Expenses table fixed! Refresh your dashboard.' as status;