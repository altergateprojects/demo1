import { supabase } from '../lib/supabase'

/**
 * Get recent notifications
 */
export const getNotifications = async (limit = 50, unreadOnly = false) => {
  try {
    const { data, error } = await supabase.rpc('get_recent_notifications', {
      p_limit: limit,
      p_unread_only: unreadOnly
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  try {
    const { data, error } = await supabase.rpc('get_unread_notification_count')

    if (error) throw error
    return data || 0
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error marking all as read:', error)
    throw error
  }
}

/**
 * Subscribe to new notifications (real-time)
 */
export const subscribeToNotifications = (callback) => {
  // Use a unique channel name with timestamp to avoid conflicts
  const channelName = `admin_notifications_${Date.now()}`
  
  // Remove any existing channels with similar names first
  supabase.getChannels().forEach(channel => {
    if (channel.topic.startsWith('admin_notifications')) {
      supabase.removeChannel(channel)
    }
  })
  
  // Create channel and add listener BEFORE subscribing
  const channel = supabase.channel(channelName)
  
  // Add the postgres_changes listener
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'admin_notifications'
    },
    (payload) => {
      callback(payload.new)
    }
  )
  
  // Now subscribe
  channel.subscribe()

  return channel
}

/**
 * Unsubscribe from notifications
 */
export const unsubscribeFromNotifications = (channel) => {
  if (channel) {
    supabase.removeChannel(channel)
  }
}

/**
 * Create manual notification (for testing or special cases)
 */
export const createNotification = async ({
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  amountPaise = null,
  priority = 'normal',
  metadata = null
}) => {
  try {
    const { data, error } = await supabase.rpc('create_admin_notification', {
      p_type: type,
      p_title: title,
      p_message: message,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_amount_paise: amountPaise,
      p_priority: priority,
      p_metadata: metadata
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
