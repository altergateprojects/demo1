-- Quick diagnosis of expense dates issue

-- Show all expenses with their dates
SELECT 
    id,
    expense_date,
    amount_paise / 100.0 as amount_rupees,
    type,
    category,
    is_approved,
    is_deleted,
    created_at
FROM expenses
WHERE is_deleted = false
ORDER BY expense_date DESC NULLS LAST;

-- Show current academic year
SELECT 
    year_label,
    start_date,
    end_date,
    is_current
FROM academic_years
WHERE is_current = true;

-- Count expenses by date range
SELECT 
    COUNT(*) FILTER (WHERE expense_date >= '2024-06-01' AND expense_date <= '2025-05-31') as in_academic_year,
    COUNT(*) FILTER (WHERE expense_date < '2024-06-01') as before_academic_year,
    COUNT(*) FILTER (WHERE expense_date > '2025-05-31') as after_academic_year,
    COUNT(*) FILTER (WHERE expense_date IS NULL) as no_date,
    COUNT(*) as total
FROM expenses
WHERE is_deleted = false AND is_approved = true;
