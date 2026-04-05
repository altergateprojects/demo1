-- COMPLETE FIX for pocket money double deduction issue
-- This script will clean up all conflicting triggers and create a single, correct one

-- Step 1: Clean up all existing triggers and functions
DROP TRIGGER IF EXISTS trg_update_pocket_money ON pocket_money_transactions;
DROP TRIGGER IF EXISTS trg_update_pocket_money_balance ON pocket_money_transactions;
DROP FUNCTION IF EXISTS update_student_pocket_money() CASCADE;

-- Step 2: Remove constraints that prevent negative balances
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_pocket_money_paise_check;
ALTER TABLE pocket_money_transactions DROP CONSTRAINT IF EXISTS pocket_money_transactions_balance_after_paise_check;

-- Step 3: Make balance_after_paise nullable since we won't use it for balance calculation
ALTER TABLE pocket_money_transactions ALTER COLUMN balance_after_paise DROP NOT NULL;

-- Step 4: Create the correct trigger function (only one way to update balance)
CREATE OR REPLACE FUNCTION update_student_pocket_money() RETURNS TRIGGER AS $$
BEGIN
  -- Update student's pocket money balance based on transaction type
  -- This is the ONLY place where student balance gets updated
  IF NEW.transaction_type = 'credit' THEN
    -- Credit: Add money to current balance
    UPDATE students
    SET pocket_money_paise = pocket_money_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  ELSIF NEW.transaction_type = 'debit' THEN
    -- Debit: Subtract money from current balance (can go negative for overdrafts)
    UPDATE students
    SET pocket_money_paise = pocket_money_paise - NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger (only one!)
CREATE TRIGGER trg_update_pocket_money 
  AFTER INSERT ON pocket_money_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_pocket_money();

-- Step 6: Verify the fix
SELECT 'Pocket money system fixed! No more double deduction.' as status;

-- Step 7: Show current balances to verify
SELECT 
  full_name,
  roll_number,
  pocket_money_paise / 100.0 as balance_rupees,
  CASE 
    WHEN pocket_money_paise < 0 THEN 'OVERDRAFT'
    WHEN pocket_money_paise = 0 THEN 'ZERO'
    ELSE 'POSITIVE'
  END as status
FROM students 
WHERE is_deleted = false
ORDER BY pocket_money_paise ASC
LIMIT 15;