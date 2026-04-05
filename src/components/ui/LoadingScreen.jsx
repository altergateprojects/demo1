import React from 'react'

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          Loading School Audit System
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please wait while we initialize the application...
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen