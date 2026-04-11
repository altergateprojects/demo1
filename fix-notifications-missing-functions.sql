-- ============================================================================
-- FIX NOTIFICATIONS - Add Missing Functions Only
-- Run this if notifications page is black but table already exists
-- ============================================================================

-- Check what exists
SELECT 
  '=== CHECKING EXISTING SETUP ===' as status,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_notifications') as table_exists,
  EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'get_recent_notifications') as get_function_exists,
  EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'get_unread_notification_count') as count_function_exists,
  EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'mark_notification_read') as mark_function_exists;

-- ============================================================================
-- FUNCTION: Get recent notifications with user details
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
  performed_by UUID,
  performed_by_name TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMP WITH TIME ZONE,
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
    n.performed_by,
    COALESCE(up.full_name, u.email) as performed_by_name,
    n.is_read,
    n.read_at,
    n.priority,
    n.metadata,
    n.created_at
  FROM admin_notifications n
  LEFT JOIN auth.users u ON n.performed_by = u.id
  LEFT JOIN user_profiles up ON n.performed_by = up.id
  WHERE (NOT p_unread_only OR n.is_read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get unread notification count
-- ============================================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM admin_notifications
  WHERE is_read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Mark notification as read
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID
)
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
-- FUNCTION: Create notification (for manual/system use)
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
  -- Get current user ID (may be NULL for system operations)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recent_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_notification TO authenticated;

-- ============================================================================
-- TEST THE FUNCTIONS
-- ============================================================================

-- Test: Get recent notifications
SELECT 
  '=== TEST: Get Recent Notifications ===' as test,
  COUNT(*) as notification_count
FROM get_recent_notifications(10, FALSE);

-- Test: Get unread count
SELECT 
  '=== TEST: Get Unread Count ===' as test,
  get_unread_notification_count() as unread_count;

-- Test: Create a test notification
SELECT 
  '=== TEST: Create Notification ===' as test,
  create_admin_notification(
    'expense_large',
    'Test Notification',
    'This is a test notification to verify the system works',
    'expense',
    NULL,
    1000000,
    'high',
    NULL
  ) as notification_id;

-- Verify test notification was created
SELECT 
  '=== TEST: Verify Test Notification ===' as test,
  id,
  title,
  message,
  priority,
  created_at
FROM admin_notifications
WHERE title = 'Test Notification'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  '=== SETUP COMPLETE ===' as status,
  'All notification functions have been created/updated' as message,
  'Refresh your browser and try the notifications page again' as next_step;
