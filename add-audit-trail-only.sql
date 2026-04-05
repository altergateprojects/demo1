-- Add audit trail functionality to existing expenses table
-- Run this if you want to keep existing data and just add audit features

-- Create audit trail table
CREATE TABLE IF NOT EXISTS public.expense_audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'LOCK', 'SOFT_DELETE', 'RESTORE'
  )),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  approval_required BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  is_system_record BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE public.expense_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view audit trail" ON public.expense_audit_trail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "System can insert audit records" ON public.expense_audit_trail
  FOR INSERT WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_audit_trail_expense ON expense_audit_trail (expense_id, performed_at DESC);

-- Create trigger to automatically create audit trail on expense changes
CREATE OR REPLACE FUNCTION create_expense_audit_trail()
RETURNS TRIGGER AS $
BEGIN
  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO expense_audit_trail (
      expense_id, action_type, change_reason, performed_by
    ) VALUES (
      NEW.id, 'CREATE', 'Expense created', NEW.recorded_by
    );
    
  -- Log updates
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log amount changes
    IF OLD.amount_paise != NEW.amount_paise THEN
      INSERT INTO expense_audit_trail (
        expense_id, action_type, field_name, old_value, new_value,
        change_reason, performed_by
      ) VALUES (
        NEW.id, 'UPDATE', 'amount_paise', OLD.amount_paise::TEXT, NEW.amount_paise::TEXT,
        'Amount modified', NEW.recorded_by
      );
    END IF;
    
    -- Log description changes
    IF OLD.description != NEW.description THEN
      INSERT INTO expense_audit_trail (
        expense_id, action_type, field_name, old_value, new_value,
        change_reason, performed_by
      ) VALUES (
        NEW.id, 'UPDATE', 'description', OLD.description, NEW.description,
        'Description modified', NEW.recorded_by
      );
    END IF;
    
    -- Log other field changes as needed
    IF OLD.vendor_name != NEW.vendor_name THEN
      INSERT INTO expense_audit_trail (
        expense_id, action_type, field_name, old_value, new_value,
        change_reason, performed_by
      ) VALUES (
        NEW.id, 'UPDATE', 'vendor_name', OLD.vendor_name, NEW.vendor_name,
        'Vendor modified', NEW.recorded_by
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_expense_audit_trail ON expenses;
CREATE TRIGGER trigger_expense_audit_trail
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_audit_trail();

-- Test the setup
SELECT 'Audit trail setup complete!' as status;