import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  subscribeToNotifications,
  unsubscribeFromNotifications
} from '../api/notifications.api'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

/**
 * Hook to fetch notifications
 */
export const useNotifications = (limit = 50, unreadOnly = false) => {
  return useQuery({
    queryKey: ['notifications', limit, unreadOnly],
    queryFn: () => getNotifications(limit, unreadOnly),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  })
}

/**
 * Hook to get unread count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 5000
  })
}

/**
 * Hook to mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('Error marking as read:', error)
      toast.error('Failed to mark notification as read')
    }
  })
}

/**
 * Hook to mark all as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: (count) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (count > 0) {
        toast.success(`Marked ${count} notifications as read`)
      }
    },
    onError: (error) => {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  })
}

/**
 * Hook for real-time notifications
 */
export const useRealtimeNotifications = (enabled = true) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    let channel = null

    try {
      channel = subscribeToNotifications((newNotification) => {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        
        // Show toast for high priority notifications
        if (newNotification.priority === 'high' || newNotification.priority === 'critical') {
          toast(newNotification.title, {
            icon: newNotification.priority === 'critical' ? '🚨' : '⚠️',
            duration: 5000
          })
        }
      })
    } catch (error) {
      console.error('Error setting up real-time notifications:', error)
    }

    return () => {
      if (channel) {
        unsubscribeFromNotifications(channel)
      }
    }
  }, [enabled, queryClient])
}
