-- Fix the generate_receipt_number function
-- This function has a syntax error - ambiguous column reference

DROP FUNCTION IF EXISTS generate_receipt_number(TEXT);

CREATE OR REPLACE FUNCTION generate_receipt_number(academic_year TEXT)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  receipt_num TEXT;
BEGIN
  -- Get the next receipt number for this academic year
  -- Use table-qualified column name to avoid ambiguity
  SELECT COALESCE(MAX(CAST(SUBSTRING(fp.receipt_number FROM 'RCPT-' || academic_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM fee_payments fp
  WHERE fp.receipt_number LIKE 'RCPT-' || academic_year || '-%';
  
  -- Format the receipt number
  receipt_num := 'RCPT-' || academic_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_receipt_number(TEXT) TO authenticated;

-- Test the function
SELECT generate_receipt_number('2024-25') as test_receipt_number;