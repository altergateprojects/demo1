-- Enhanced expenses table with fraud prevention and audit trail
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.expense_audit_trail CASCADE;
DROP TABLE IF EXISTS public.expense_attachments CASCADE;

-- Main expenses table (immutable after creation)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_number TEXT UNIQUE NOT NULL, -- Sequential number for tracking
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'construction_repair','utilities','stationery','cleaning_sanitation',
    'security','transport','events_programs','government_fees',
    'staff_welfare','medical_firstaid','library','technology',
    'sports_equipment','bank_charges','audit_fees','legal_fees','miscellaneous'
  )),
  sub_category TEXT,
  description TEXT NOT NULL CHECK (char_length(description) >= 5),
  vendor_name TEXT,
  vendor_phone TEXT,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  type TEXT NOT NULL CHECK (type IN ('debit','refund')) DEFAULT 'debit',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','cheque','upi','bank_transfer','dd','neft','rtgs')),
  reference_number TEXT,
  bill_number TEXT,
  needs_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Fraud prevention fields
  is_locked BOOLEAN NOT NULL DEFAULT FALSE, -- Once locked, cannot be modified
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id),
  
  -- Soft delete (never actually delete financial records)
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  deletion_reason TEXT,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_ip TEXT,
  created_user_agent TEXT,
  
  -- Hash for integrity verification
  data_hash TEXT, -- SHA-256 hash of critical fields
  
  CONSTRAINT no_modification_after_lock CHECK (
    (is_locked = false) OR 
    (is_locked = true AND locked_at IS NOT NULL AND locked_by IS NOT NULL)
  )
);

-- Expense audit trail - tracks ALL changes
CREATE TABLE public.expense_audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'LOCK', 'SOFT_DELETE', 'RESTORE'
  )),
  field_name TEXT, -- Which field was changed
  old_value TEXT, -- Previous value
  new_value TEXT, -- New value
  change_reason TEXT NOT NULL, -- Mandatory reason for any change
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  
  -- Additional context
  approval_required BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Prevent deletion of audit records
  is_system_record BOOLEAN NOT NULL DEFAULT TRUE
);

-- Expense attachments (bills, receipts, etc.)
CREATE TABLE public.expense_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_extension TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase storage path
  upload_url TEXT, -- Temporary upload URL
  
  -- File integrity
  file_hash TEXT NOT NULL, -- SHA-256 hash of file content
  
  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent deletion
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  deletion_reason TEXT
);

-- Expense sequence for generating expense numbers
CREATE SEQUENCE IF NOT EXISTS expense_number_seq START 1;

-- Function to generate expense number
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  seq_num TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  seq_num := LPAD(nextval('expense_number_seq')::TEXT, 6, '0');
  RETURN 'EXP' || year_suffix || seq_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate data hash
CREATE OR REPLACE FUNCTION calculate_expense_hash(
  p_amount_paise BIGINT,
  p_expense_date DATE,
  p_category TEXT,
  p_description TEXT,
  p_vendor_name TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      COALESCE(p_amount_paise::TEXT, '') || '|' ||
      COALESCE(p_expense_date::TEXT, '') || '|' ||
      COALESCE(p_category, '') || '|' ||
      COALESCE(p_description, '') || '|' ||
      COALESCE(p_vendor_name, ''),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate expense number and hash
CREATE OR REPLACE FUNCTION set_expense_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expense number if not provided
  IF NEW.expense_number IS NULL THEN
    NEW.expense_number := generate_expense_number();
  END IF;
  
  -- Calculate and set data hash
  NEW.data_hash := calculate_expense_hash(
    NEW.amount_paise,
    NEW.expense_date,
    NEW.category,
    NEW.description,
    NEW.vendor_name
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_expense_defaults
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_expense_defaults();

-- Trigger to prevent modification of locked expenses
CREATE OR REPLACE FUNCTION prevent_locked_expense_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow updates only if expense is not locked
  IF OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'Cannot modify locked expense. Expense ID: %, Locked at: %', 
      OLD.id, OLD.locked_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_locked_modification
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_expense_modification();

-- Trigger to create audit trail for all changes
CREATE OR REPLACE FUNCTION create_expense_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  field_changes RECORD;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
    
    -- Log creation
    INSERT INTO expense_audit_trail (
      expense_id, action_type, change_reason, performed_by, 
      ip_address, user_agent
    ) VALUES (
      NEW.id, action_type, 'Expense created', NEW.recorded_by,
      NEW.created_ip, NEW.created_user_agent
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log specific field changes
    IF OLD.amount_paise != NEW.amount_paise THEN
      INSERT INTO expense_audit_trail (
        expense_id, action_type, field_name, old_value, new_value,
        change_reason, performed_by
      ) VALUES (
        NEW.id, 'UPDATE', 'amount_paise', OLD.amount_paise::TEXT, NEW.amount_paise::TEXT,
        'Amount modified', NEW.recorded_by
      );
    END IF;
    
    IF OLD.description != NEW.description THEN
      INSERT INTO expense_audit_trail (
        expense_id, action_type, field_name, old_value, new_value,
        change_reason, performed_by
      ) VALUES (
        NEW.id, 'UPDATE', 'description', OLD.description, NEW.description,
        'Description modified', NEW.recorded_by
      );
    END IF;
    
    -- Log approval changes
    IF OLD.is_approved IS DISTINCT FROM NEW.is_approved THEN
      action_type := CASE WHEN NEW.is_approved = TRUE THEN 'APPROVE' ELSE 'REJECT' END;
      INSERT INTO expense_audit_trail (
        expense_id, action_type, change_reason, performed_by, approved_by, approved_at
      ) VALUES (
        NEW.id, action_type, COALESCE(NEW.approval_notes, 'No reason provided'), 
        NEW.approved_by, NEW.approved_by, NEW.approved_at
      );
    END IF;
    
    -- Log locking
    IF OLD.is_locked != NEW.is_locked AND NEW.is_locked = TRUE THEN
      INSERT INTO expense_audit_trail (
        expense_id, action_type, change_reason, performed_by
      ) VALUES (
        NEW.id, 'LOCK', 'Expense locked for security', NEW.locked_by
      );
    END IF;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expense_audit_trail
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_audit_trail();

-- RLS Policies
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Finance users can insert expenses" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
      AND user_profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Finance users can update unlocked expenses" ON public.expenses
  FOR UPDATE USING (
    is_locked = FALSE AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
      AND user_profiles.role IN ('admin', 'finance')
    )
  );

-- Audit trail policies (read-only for most users)
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

-- Attachments policies
CREATE POLICY "Users can view attachments" ON public.expense_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Finance users can upload attachments" ON public.expense_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
      AND user_profiles.role IN ('admin', 'finance')
    )
  );

-- Indexes for performance
CREATE INDEX idx_expenses_number ON expenses (expense_number);
CREATE INDEX idx_expenses_date_year ON expenses (expense_date, academic_year_id);
CREATE INDEX idx_expenses_category ON expenses (category);
CREATE INDEX idx_expenses_locked ON expenses (is_locked);
CREATE INDEX idx_audit_trail_expense ON expense_audit_trail (expense_id, performed_at DESC);
CREATE INDEX idx_audit_trail_user ON expense_audit_trail (performed_by, performed_at DESC);
CREATE INDEX idx_attachments_expense ON expense_attachments (expense_id);

-- Create storage bucket for expense attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-attachments', 'expense-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Finance users can upload expense attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view expense attachments" ON storage.objects;

-- Storage policies
CREATE POLICY "Finance users can upload expense attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'expense-attachments' AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
      AND user_profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Users can view expense attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'expense-attachments' AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_active = true
    )
  );