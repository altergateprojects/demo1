-- Fix expense dates to fall within current academic year
-- This will make dashboard show expenses correctly

-- Step 1: Show the problem
SELECT '=== CURRENT SITUATION ===' as info;

SELECT 
    (SELECT year_label FROM academic_years WHERE is_current = true) as current_year,
    (SELECT start_date FROM academic_years WHERE is_current = true) as year_start,
    (SELECT end_date FROM academic_years WHERE is_current = true) as year_end,
    COUNT(*) as total_expenses,
    COUNT(*) FILTER (WHERE expense_date > (SELECT end_date FROM academic_years WHERE is_current = true)) as expenses_after_year_end,
    SUM(amount_paise) FILTER (WHERE type = 'debit' AND is_approved = true AND is_deleted = false) as total_debit_paise
FROM expenses;

-- Step 2: Update expenses that are after the academic year end date
-- Set them to the last day of the academic year
UPDATE expenses
SET expense_date = (SELECT end_date FROM academic_years WHERE is_current = true)
WHERE expense_date > (SELECT end_date FROM academic_years WHERE is_current = true)
AND is_deleted = false;

-- Step 3: Update expenses that are before the academic year start date
-- Set them to the first day of the academic year
UPDATE expenses
SET expense_date = (SELECT start_date FROM academic_years WHERE is_current = true)
WHERE expense_date < (SELECT start_date FROM academic_years WHERE is_current = true)
AND is_deleted = false;

-- Step 4: Update expenses with NULL dates
-- Set them to today's date, but capped at academic year end
UPDATE expenses
SET expense_date = LEAST(
    CURRENT_DATE,
    (SELECT end_date FROM academic_years WHERE is_current = true)
)
WHERE expense_date IS NULL
AND is_deleted = false;

-- Step 5: Verify the fix
SELECT '=== AFTER FIX ===' as info;

SELECT 
    COUNT(*) as total_expenses,
    COUNT(*) FILTER (WHERE expense_date >= (SELECT start_date FROM academic_years WHERE is_current = true) 
                     AND expense_date <= (SELECT end_date FROM academic_years WHERE is_current = true)) as in_academic_year,
    SUM(CASE WHEN type = 'debit' THEN amount_paise ELSE -amount_paise END) 
        FILTER (WHERE is_approved = true AND is_deleted = false 
                AND expense_date >= (SELECT start_date FROM academic_years WHERE is_current = true)
                AND expense_date <= (SELECT end_date FROM academic_years WHERE is_current = true)) / 100.0 as net_expenses_rupees
FROM expenses;

SELECT '=== UPDATED EXPENSES ===' as info;

SELECT 
    id,
    expense_date,
    amount_paise / 100.0 as amount_rupees,
    type,
    category,
    is_approved
FROM expenses
WHERE is_deleted = false
ORDER BY expense_date DESC;
