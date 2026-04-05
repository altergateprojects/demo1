-- Run this to get the user IDs after creating users in Auth
SELECT id, email FROM auth.users ORDER BY created_at DESC;