-- Fix pocket money trigger to prevent double deduction
-- This ensures the balance is only updated once by the trigger

-- 1. Drop existing trigger
DROP TRIGGER IF EXISTS trg_update_pocket_money ON pocket_money_transactions;

-- 2. Recreate the trigger function with proper logic
CREATE OR REPLACE FUNCTION update_student_pocket_money() RETURNS TRIGGER AS $$
BEGIN
  -- Update student's pocket money balance (allow negative balances)
  IF NEW.transaction_type = 'credit' THEN
    -- Credit: Add money to balance
    UPDATE students
    SET pocket_money_paise = pocket_money_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  ELSIF NEW.transaction_type = 'debit' THEN
    -- Debit: Subtract money from balance (can go negative)
    UPDATE students
    SET pocket_money_paise = pocket_money_paise - NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
CREATE TRIGGER trg_update_pocket_money 
  AFTER INSERT ON pocket_money_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_pocket_money();

-- 4. Test query to check current balances
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
SELECT 'Pocket money trigger fixed! No more double deduction.' as status;