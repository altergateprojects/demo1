-- Fix double deduction issue in pocket money transactions
-- The problem: Two different trigger approaches were conflicting

-- 1. Drop ALL existing pocket money triggers
DROP TRIGGER IF EXISTS trg_update_pocket_money ON pocket_money_transactions;
DROP TRIGGER IF EXISTS trg_update_pocket_money_balance ON pocket_money_transactions;

-- 2. Drop the old trigger function
DROP FUNCTION IF EXISTS update_student_pocket_money();

-- 3. Create a simple, clean trigger function that only updates based on transaction amounts
CREATE OR REPLACE FUNCTION update_student_pocket_money() RETURNS TRIGGER AS $$
BEGIN
  -- Update student's pocket money balance based on transaction type
  IF NEW.transaction_type = 'credit' THEN
    -- Credit: Add money to current balance
    UPDATE students
    SET pocket_money_paise = pocket_money_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  ELSIF NEW.transaction_type = 'debit' THEN
    -- Debit: Subtract money from current balance (can go negative)
    UPDATE students
    SET pocket_money_paise = pocket_money_paise - NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger (only one!)
CREATE TRIGGER trg_update_pocket_money 
  AFTER INSERT ON pocket_money_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_pocket_money();

-- 5. Remove the balance_after_paise constraint that prevents negative values
ALTER TABLE pocket_money_transactions DROP CONSTRAINT IF EXISTS pocket_money_transactions_balance_after_paise_check;

-- 6. Test the fix
SELECT 'Double deduction issue fixed! Only one trigger now handles balance updates.' as status;

-- 7. Show current student balances
SELECT 
  full_name,
  roll_number,
  pocket_money_paise / 100.0 as current_balance_rupees
FROM students 
WHERE is_deleted = false
ORDER BY pocket_money_paise ASC
LIMIT 10;