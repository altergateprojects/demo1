import React from 'react'

const Card = ({ 
  children, 
  className = '',
  padding = true,
  ...props 
}) => {
  const baseClasses = 'card'
  const paddingClasses = padding ? 'p-6' : ''
  const classes = `${baseClasses} ${paddingClasses} ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`border-b border-slate-200 dark:border-slate-700 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  )
}

const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 ${className}`}>
      {children}
    </h3>
  )
}

const CardContent = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`border-t border-slate-200 dark:border-slate-700 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Content = CardContent
Card.Footer = CardFooter

export default Card