-- Allow negative pocket money balances
-- This enables debit transactions even when balance is zero or insufficient

-- 1. Remove the constraint that prevents negative pocket money in students table
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_pocket_money_paise_check;

-- 2. Remove the constraint that prevents negative balance_after_paise in transactions
ALTER TABLE pocket_money_transactions DROP CONSTRAINT IF EXISTS pocket_money_transactions_balance_after_paise_check;

-- 3. Update the trigger function to allow negative balances
CREATE OR REPLACE FUNCTION update_student_pocket_money() RETURNS TRIGGER AS $$
BEGIN
  -- Update student's pocket money balance (allow negative balances)
  IF NEW.transaction_type = 'credit' THEN
    -- Credit: Add money to balance
    UPDATE students
    SET pocket_money_paise = pocket_money_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  ELSE
    -- Debit: Subtract money from balance (can go negative)
    UPDATE students
    SET pocket_money_paise = pocket_money_paise - NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger (if it doesn't exist)
DROP TRIGGER IF EXISTS trg_update_pocket_money ON pocket_money_transactions;
CREATE TRIGGER trg_update_pocket_money 
  AFTER INSERT ON pocket_money_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_pocket_money();

-- 5. Test the changes
SELECT 
  full_name,
  roll_number,
  pocket_money_paise / 100.0 as pocket_money_rupees,
  CASE 
    WHEN pocket_money_paise < 0 THEN 'NEGATIVE (Owes Money)'
    WHEN pocket_money_paise = 0 THEN 'ZERO'
    ELSE 'POSITIVE'
  END as balance_status
FROM students 
WHERE is_deleted = false
ORDER BY pocket_money_paise ASC
LIMIT 10;

-- Success message
SELECT 'Negative pocket money balances are now allowed! Students can have overdrafts.' as status;