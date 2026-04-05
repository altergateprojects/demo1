import React from 'react'
import Button from './Button'

const EmptyState = ({ 
  icon,
  title, 
  description, 
  action,
  actionLabel,
  className = '' 
}) => {
  const defaultIcon = (
    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon || defaultIcon}
      </div>
      
      {title && (
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState