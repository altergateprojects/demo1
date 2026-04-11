-- ============================================================================
-- ADMIN NOTIFICATION SYSTEM
-- Tracks edits, updates, and large expenses (>₹5000)
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification details
  type VARCHAR(50) NOT NULL, -- 'expense_edit', 'payment_edit', 'large_expense', 'fee_correction', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity
  entity_type VARCHAR(50), -- 'expense', 'fee_payment', 'student', etc.
  entity_id UUID,
  
  -- Financial details (for large expenses)
  amount_paise BIGINT,
  
  -- User who performed the action
  performed_by UUID REFERENCES auth.users(id),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES auth.users(id),
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Metadata
  metadata JSONB, -- Store additional context
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_type CHECK (type IN (
    'expense_edit', 'expense_large', 'payment_edit', 'payment_correction',
    'student_edit', 'teacher_edit', 'fee_config_edit', 'due_edit'
  )),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'critical'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON admin_notifications(entity_type, entity_id);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view notifications
CREATE POLICY "Admins can view all notifications"
  ON admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Policy: System can insert notifications
CREATE POLICY "System can insert notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update (mark as read)
CREATE POLICY "Admins can update notifications"
  ON admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTION: Create notification
-- ============================================================================
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_amount_paise BIGINT DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Insert notification
  INSERT INTO admin_notifications (
    type,
    title,
    message,
    entity_type,
    entity_id,
    amount_paise,
    performed_by,
    priority,
    metadata
  ) VALUES (
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_amount_paise,
    v_user_id,
    p_priority,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Expense edits
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_expense_edit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_old_amount NUMERIC;
  v_new_amount NUMERIC;
BEGIN
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM user_profiles
  WHERE id = auth.uid();
  
  v_old_amount := OLD.amount_paise / 100.0;
  v_new_amount := NEW.amount_paise / 100.0;
  
  -- Create notification for edit
  PERFORM create_admin_notification(
    'expense_edit',
    'Expense Modified',
    format('%s edited expense "%s" from ₹%s to ₹%s',
      COALESCE(v_user_name, 'User'),
      COALESCE(NEW.description, 'Unnamed'),
      v_old_amount,
      v_new_amount
    ),
    'expense',
    NEW.id,
    NEW.amount_paise,
    CASE 
      WHEN ABS(NEW.amount_paise - OLD.amount_paise) > 100000 THEN 'high'
      ELSE 'normal'
    END,
    jsonb_build_object(
      'old_amount_paise', OLD.amount_paise,
      'new_amount_paise', NEW.amount_paise,
      'old_description', OLD.description,
      'new_description', NEW.description,
      'expense_date', NEW.expense_date
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_expense_edit ON expenses;
CREATE TRIGGER trigger_notify_expense_edit
  AFTER UPDATE ON expenses
  FOR EACH ROW
  WHEN (
    OLD.amount_paise IS DISTINCT FROM NEW.amount_paise OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.category IS DISTINCT FROM NEW.category OR
    OLD.vendor_name IS DISTINCT FROM NEW.vendor_name
  )
  EXECUTE FUNCTION notify_expense_edit();

-- ============================================================================
-- TRIGGER: Large expenses (>₹5000)
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_large_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_amount NUMERIC;
BEGIN
  -- Only for new expenses over ₹5000
  IF NEW.amount_paise > 500000 THEN
    -- Get user name
    SELECT full_name INTO v_user_name
    FROM user_profiles
    WHERE id = auth.uid();
    
    v_amount := NEW.amount_paise / 100.0;
    
    -- Create notification
    PERFORM create_admin_notification(
      'expense_large',
      'Large Expense Created',
      format('%s created a large expense of ₹%s for "%s"',
        COALESCE(v_user_name, 'User'),
        v_amount,
        COALESCE(NEW.description, 'Unnamed')
      ),
      'expense',
      NEW.id,
      NEW.amount_paise,
      CASE 
        WHEN NEW.amount_paise > 2000000 THEN 'critical' -- >₹20,000
        WHEN NEW.amount_paise > 1000000 THEN 'high'     -- >₹10,000
        ELSE 'normal'
      END,
      jsonb_build_object(
        'category', NEW.category,
        'vendor_name', NEW.vendor_name,
        'payment_method', NEW.payment_method,
        'expense_date', NEW.expense_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_large_expense ON expenses;
CREATE TRIGGER trigger_notify_large_expense
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION notify_large_expense();

-- ============================================================================
-- TRIGGER: Fee payment corrections/edits
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_payment_correction()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_student_name TEXT;
  v_old_amount NUMERIC;
  v_new_amount NUMERIC;
BEGIN
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Get student name
  SELECT full_name INTO v_student_name
  FROM students
  WHERE id = NEW.student_id;
  
  v_old_amount := OLD.amount_paise / 100.0;
  v_new_amount := NEW.amount_paise / 100.0;
  
  -- Create notification
  PERFORM create_admin_notification(
    'payment_edit',
    'Fee Payment Modified',
    format('%s edited payment for %s from ₹%s to ₹%s',
      COALESCE(v_user_name, 'User'),
      COALESCE(v_student_name, 'Student'),
      v_old_amount,
      v_new_amount
    ),
    'fee_payment',
    NEW.id,
    NEW.amount_paise,
    'high', -- Payment edits are always high priority
    jsonb_build_object(
      'student_id', NEW.student_id,
      'student_name', v_student_name,
      'old_amount_paise', OLD.amount_paise,
      'new_amount_paise', NEW.amount_paise,
      'payment_date', NEW.payment_date
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_payment_correction ON fee_payments;
CREATE TRIGGER trigger_notify_payment_correction
  AFTER UPDATE ON fee_payments
  FOR EACH ROW
  WHEN (OLD.amount_paise IS DISTINCT FROM NEW.amount_paise)
  EXECUTE FUNCTION notify_payment_correction();

-- ============================================================================
-- FUNCTION: Mark notification as read
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE admin_notifications
  SET 
    is_read = TRUE,
    read_at = NOW(),
    read_by = auth.uid()
  WHERE id = p_notification_id
    AND is_read = FALSE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Mark all notifications as read
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE admin_notifications
  SET 
    is_read = TRUE,
    read_at = NOW(),
    read_by = auth.uid()
  WHERE is_read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get unread notification count
-- ============================================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM admin_notifications
    WHERE is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get recent notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION get_recent_notifications(
  p_limit INTEGER DEFAULT 50,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  title VARCHAR,
  message TEXT,
  entity_type VARCHAR,
  entity_id UUID,
  amount_paise BIGINT,
  performed_by_name TEXT,
  is_read BOOLEAN,
  priority VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.entity_type,
    n.entity_id,
    n.amount_paise,
    up.full_name as performed_by_name,
    n.is_read,
    n.priority,
    n.metadata,
    n.created_at
  FROM admin_notifications n
  LEFT JOIN user_profiles up ON up.id = n.performed_by
  WHERE (NOT p_unread_only OR n.is_read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION create_admin_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_notifications TO authenticated;

-- ============================================================================
-- Test data (optional - comment out for production)
-- ============================================================================
/*
-- Create a test notification
SELECT create_admin_notification(
  'expense_large',
  'Test: Large Expense',
  'This is a test notification for a large expense of ₹10,000',
  'expense',
  NULL,
  1000000,
  'high',
  '{"test": true}'::jsonb
);

-- Check notifications
SELECT * FROM get_recent_notifications(10, FALSE);

-- Check unread count
SELECT get_unread_notification_count();
*/

-- ============================================================================
-- DONE! Notification system is ready
-- ============================================================================
