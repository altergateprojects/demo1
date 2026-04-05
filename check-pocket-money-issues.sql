-- Check for potential double deduction issues in pocket money

-- 1. Check recent pocket money transactions
SELECT 
  pmt.id,
  s.full_name,
  s.roll_number,
  pmt.transaction_type,
  pmt.amount_paise / 100.0 as amount_rupees,
  pmt.balance_after_paise / 100.0 as expected_balance,
  s.pocket_money_paise / 100.0 as actual_balance,
  (s.pocket_money_paise - pmt.balance_after_paise) / 100.0 as difference,
  pmt.created_at
FROM pocket_money_transactions pmt
JOIN students s ON s.id = pmt.student_id
WHERE pmt.created_at > NOW() - INTERVAL '1 day'
ORDER BY pmt.created_at DESC
LIMIT 20;

-- 2. Check students with suspicious negative balances
SELECT 
  s.full_name,
  s.roll_number,
  s.pocket_money_paise / 100.0 as current_balance,
  COUNT(pmt.id) as transaction_count,
  SUM(CASE WHEN pmt.transaction_type = 'credit' THEN pmt.amount_paise ELSE 0 END) / 100.0 as total_credits,
  SUM(CASE WHEN pmt.transaction_type = 'debit' THEN pmt.amount_paise ELSE 0 END) / 100.0 as total_debits,
  (SUM(CASE WHEN pmt.transaction_type = 'credit' THEN pmt.amount_paise ELSE -pmt.amount_paise END)) / 100.0 as calculated_balance
FROM students s
LEFT JOIN pocket_money_transactions pmt ON pmt.student_id = s.id
WHERE s.is_deleted = false
GROUP BY s.id, s.full_name, s.roll_number, s.pocket_money_paise
HAVING s.pocket_money_paise != COALESCE(SUM(CASE WHEN pmt.transaction_type = 'credit' THEN pmt.amount_paise ELSE -pmt.amount_paise END), 0)
ORDER BY s.pocket_money_paise ASC;