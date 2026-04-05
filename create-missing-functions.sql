-- Create missing database functions
-- Run this in Supabase SQL Editor

-- Function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number(academic_year TEXT)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  receipt_number TEXT;
BEGIN
  -- Get the next receipt number for this academic year
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 'RCPT-' || academic_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM fee_payments
  WHERE receipt_number LIKE 'RCPT-' || academic_year || '-%';
  
  -- Format the receipt number
  receipt_number := 'RCPT-' || academic_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;