-- Check if notifications table exists
SELECT 
  '=== NOTIFICATIONS TABLE CHECK ===' as check_type,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) as table_exists;

-- If table exists, check structure
SELECT 
  '=== TABLE STRUCTURE ===' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  '=== RLS POLICIES ===' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';

-- Try to select from notifications (will fail if RLS blocks)
SELECT 
  '=== SAMPLE DATA ===' as check_type,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
FROM notifications;

-- Check if current user can access
SELECT 
  '=== CURRENT USER ===' as check_type,
  current_user as database_user,
  auth.uid() as auth_user_id;
