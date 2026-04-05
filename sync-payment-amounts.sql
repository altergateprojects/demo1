-- Sync amount_paid_paise from payment logs
-- This fixes cases where payments were made but amount_paid_paise wasn't updated

-- Update amount_paid_paise for all dues based on actual payments
UPDATE student_dues sd
SET amount_paid_paise = COALESCE(
  (SELECT SUM(payment_amount_paise) 
   FROM student_due_payments 
   WHERE student_due_id = sd.id),
  0
)
WHERE EXISTS (
  SELECT 1 FROM student_due_payments WHERE student_due_id = sd.id
);

-- Also update is_cleared status for fully paid dues
UPDATE student_dues
SET is_cleared = true,
    cleared_date = CURRENT_DATE
WHERE amount_paid_paise >= amount_paise
  AND is_cleared = false;

-- Show results
SELECT 
  id,
  due_type,
  amount_paise,
  amount_paid_paise,
  is_cleared,
  (SELECT COUNT(*) FROM student_due_payments WHERE student_due_id = student_dues.id) as payment_count
FROM student_dues
WHERE amount_paid_paise > 0
ORDER BY created_at DESC;
