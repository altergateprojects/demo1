import { create } from 'zustand'

const useAlertStore = create((set, get) => ({
  // State
  alerts: [],
  unreadCount: 0,
  criticalCount: 0,
  isLoading: false,

  // Actions
  setAlerts: (alerts) => {
    const unreadCount = alerts.filter(alert => !alert.is_resolved).length
    const criticalCount = alerts.filter(alert => !alert.is_resolved && alert.severity === 'critical').length
    
    set({ 
      alerts, 
      unreadCount, 
      criticalCount 
    })
  },

  addAlert: (alert) => {
    const { alerts } = get()
    const newAlerts = [alert, ...alerts]
    
    const unreadCount = newAlerts.filter(a => !a.is_resolved).length
    const criticalCount = newAlerts.filter(a => !a.is_resolved && a.severity === 'critical').length
    
    set({ 
      alerts: newAlerts, 
      unreadCount, 
      criticalCount 
    })
  },

  resolveAlert: (alertId) => {
    const { alerts } = get()
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
        : alert
    )
    
    const unreadCount = updatedAlerts.filter(alert => !alert.is_resolved).length
    const criticalCount = updatedAlerts.filter(alert => !alert.is_resolved && alert.severity === 'critical').length
    
    set({ 
      alerts: updatedAlerts, 
      unreadCount, 
      criticalCount 
    })
  },

  removeAlert: (alertId) => {
    const { alerts } = get()
    const filteredAlerts = alerts.filter(alert => alert.id !== alertId)
    
    const unreadCount = filteredAlerts.filter(alert => !alert.is_resolved).length
    const criticalCount = filteredAlerts.filter(alert => !alert.is_resolved && alert.severity === 'critical').length
    
    set({ 
      alerts: filteredAlerts, 
      unreadCount, 
      criticalCount 
    })
  },

  setLoading: (isLoading) => set({ isLoading }),

  // Helper methods
  getCriticalAlerts: () => {
    const { alerts } = get()
    return alerts.filter(alert => !alert.is_resolved && alert.severity === 'critical')
  },

  getWarningAlerts: () => {
    const { alerts } = get()
    return alerts.filter(alert => !alert.is_resolved && alert.severity === 'warning')
  },

  getInfoAlerts: () => {
    const { alerts } = get()
    return alerts.filter(alert => !alert.is_resolved && alert.severity === 'info')
  },

  getRecentAlerts: (limit = 5) => {
    const { alerts } = get()
    return alerts
      .filter(alert => !alert.is_resolved)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  }
}))

export default useAlertStore