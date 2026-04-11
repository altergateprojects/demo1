import { useState } from 'react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useRealtimeNotifications } from '../../hooks/useNotifications'
import { formatINR, formatDate } from '../../lib/formatters'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import LoadingScreen from '../../components/ui/LoadingScreen'

const NotificationsPage = () => {
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all')
  const navigate = useNavigate()

  const { data: notifications = [], isLoading } = useNotifications(100, filter === 'unread')
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  // Enable real-time updates (disabled due to subscription issues)
  // useRealtimeNotifications(true)

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }

    // Navigate to related entity
    if (notification.entity_type && notification.entity_id) {
      switch (notification.entity_type) {
        case 'expense':
          navigate(`/expenses/${notification.entity_id}`)
          break
        case 'fee_payment':
          if (notification.metadata?.student_id) {
            navigate(`/students/${notification.metadata.student_id}`)
          }
          break
        case 'student':
          navigate(`/students/${notification.entity_id}`)
          break
        default:
          break
      }
    }
  }

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate()
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/10'
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'normal':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
      case 'low':
        return 'border-slate-300 bg-slate-50 dark:bg-slate-900/10'
      default:
        return 'border-slate-300'
    }
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      low: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    }
    return colors[priority] || colors.normal
  }

  const getTypeIcon = (type) => {
    const icons = {
      expense_edit: '✏️',
      expense_large: '💰',
      payment_edit: '💳',
      payment_correction: '🔄',
      student_edit: '👤',
      teacher_edit: '👨‍🏫',
      fee_config_edit: '⚙️',
      due_edit: '📋'
    }
    return icons[type] || '📢'
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false
    if (filter === 'read' && !n.is_read) return false
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (isLoading) return <LoadingScreen />

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">🔔</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Notifications
                  </h1>
                  <p className="mt-1 text-sm text-purple-100">
                    Stay updated on important activities
                  </p>
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center justify-center px-6 py-2 bg-white text-purple-600 hover:bg-purple-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
              >
                Mark All Read ({unreadCount})
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-purple-100 text-xs sm:text-sm font-medium">Total</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{notifications.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-purple-100 text-xs sm:text-sm font-medium">Unread</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{unreadCount}</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-purple-100 text-xs sm:text-sm font-medium">High Priority</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                {notifications.filter(n => n.priority === 'high' || n.priority === 'critical').length}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-purple-100 text-xs sm:text-sm font-medium">Today</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                {notifications.filter(n => {
                  const today = new Date().toDateString()
                  return new Date(n.created_at).toDateString() === today
                }).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show:</span>
            <div className="flex gap-2">
              {['all', 'unread', 'read'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Types</option>
              <option value="expense_edit">Expense Edits</option>
              <option value="expense_large">Large Expenses</option>
              <option value="payment_edit">Payment Edits</option>
              <option value="payment_correction">Payment Corrections</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No Notifications
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === 'unread' ? "You're all caught up!" : "No notifications to display"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${
                getPriorityColor(notification.priority)
              } ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-lg">
                    {getTypeIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        {notification.message}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {notification.amount_paise && (
                          <>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatINR(notification.amount_paise)}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatDate(notification.created_at)}</span>
                        {notification.performed_by_name && (
                          <>
                            <span>•</span>
                            <span>{notification.performed_by_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action hint */}
                    {notification.entity_id && (
                      <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
