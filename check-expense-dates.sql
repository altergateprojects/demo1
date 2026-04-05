-- 🔍 CHECK EXPENSE DATES
-- See what dates your expenses have and why they're not matching

-- Step 1: Show academic year date range
SELECT '=== ACADEMIC YEAR DATE RANGE ===' as info;

SELECT 
    year_label,
    start_date,
    end_date,
    is_current
FROM academic_years
WHERE is_current = true;

-- Step 2: Show all expenses with their dates
SELECT '=== ALL EXPENSES WITH DATES ===' as info;

SELECT 
    id,
    expense_date,
    amount_paise,
    '₹' || (amount_paise / 100)::text as amount_rupees,
    type,
    is_approved,
    is_deleted
FROM expenses
ORDER BY expense_date DESC NULLS LAST;

-- Step 3: Check if expense_date column exists
SELECT '=== EXPENSE TABLE COLUMNS ===' as info;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'expenses'
ORDER BY ordinal_position;

-- Step 4: Count expenses by date range
SELECT '=== EXPENSES COUNT BY DATE RANGE ===' as info;

SELECT 
    COUNT(*) as total_expenses,
    COUNT(CASE WHEN expense_date >= '2024-06-01' AND expense_date <= '2025-05-31' THEN 1 END) as in_current_year,
    COUNT(CASE WHEN expense_date < '2024-06-01' THEN 1 END) as before_current_year,
    COUNT(CASE WHEN expense_date > '2025-05-31' THEN 1 END) as after_current_year,
    COUNT(CASE WHEN expense_date IS NULL THEN 1 END) as no_date
FROM expenses
WHERE is_deleted = false
AND is_approved = true;

-- Step 5: Show total by type
SELECT 
    '=== TOTAL EXPENSES BY TYPE ===' as info;

SELECT 
    type,
    COUNT(*) as count,
    SUM(amount_paise) as total_paise,
    '₹' || (SUM(amount_paise) / 100)::text as total_rupees
FROM expenses
WHERE is_deleted = false
AND is_approved = true
GROUP BY type;

-- Step 6: Calculate what dashboard should show
SELECT '=== WHAT DASHBOARD SHOULD SHOW ===' as info;

SELECT 
    SUM(CASE WHEN type = 'debit' THEN amount_paise ELSE -amount_paise END) as net_expenses_paise,
    '₹' || (SUM(CASE WHEN type = 'debit' THEN amount_paise ELSE -amount_paise END) / 100)::text as net_expenses_rupees
FROM expenses
WHERE is_deleted = false
AND is_approved = true
AND expense_date >= '2024-06-01'
AND expense_date <= '2025-05-31';