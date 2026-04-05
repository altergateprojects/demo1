import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import LoadingScreen from '../ui/LoadingScreen'

const AuthGuard = ({ children }) => {
  const { session, isLoading, profile } = useAuthStore()

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />
  }

  // Redirect to login if no session
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Show loading while profile is being fetched
  if (!profile) {
    return <LoadingScreen />
  }

  // Check if user is active
  if (!profile.is_active) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
              Account Deactivated
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Your account has been deactivated. Please contact your administrator for assistance.
            </p>
            <button
              onClick={() => useAuthStore.getState().signOut()}
              className="btn-primary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default AuthGuard