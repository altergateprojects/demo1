import React from 'react'

const Skeleton = ({ 
  className = '',
  width,
  height,
  variant = 'rectangular'
}) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700'
  
  const variants = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4'
  }
  
  const style = {
    width: width,
    height: height
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${className}`
  
  return <div className={classes} style={style} />
}

// Skeleton components for common patterns
const SkeletonText = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index} 
          variant="text" 
          className={index === lines - 1 ? 'w-3/4' : 'w-full'} 
        />
      ))}
    </div>
  )
}

const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1">
          <Skeleton variant="text" className="w-1/2 mb-2" />
          <Skeleton variant="text" className="w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} variant="text" className="w-3/4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

Skeleton.Text = SkeletonText
Skeleton.Card = SkeletonCard
Skeleton.Table = SkeletonTable

export default Skeleton