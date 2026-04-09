-- Fix: Allow negative amounts in fee_payments for reversals
-- The current check constraint prevents negative amounts, but we need them for reversal entries

-- Step 1: Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'fee_payments'::regclass 
AND contype = 'c';

-- Step 2: Drop the existing check constraint that prevents negative amounts
ALTER TABLE fee_payments 
DROP CONSTRAINT IF EXISTS fee_payments_amount_paise_check;

-- Step 3: Add a new constraint that allows negative amounts only for reversals
ALTER TABLE fee_payments 
ADD CONSTRAINT fee_payments_amount_paise_check 
CHECK (
  (is_reversal = true AND amount_paise < 0) OR  -- Reversals must be negative
  (is_reversal = false AND amount_paise > 0)     -- Normal payments must be positive
);

-- Verify the new constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'fee_payments'::regclass 
AND conname = 'fee_payments_amount_paise_check';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fee payments table updated to allow negative amounts for reversals';
  RAISE NOTICE '📝 Constraint: Reversals must be negative, normal payments must be positive';
END $$;
