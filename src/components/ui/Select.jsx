import React from 'react'

const Select = React.forwardRef(({ 
  label, 
  error, 
  helperText,
  options = [],
  placeholder = 'Select an option',
  className = '',
  required = false,
  ...props 
}, ref) => {
  const hasValue = props.value && props.value !== ''
  const selectClasses = `input-field ${error ? 'border-red-300 dark:border-red-600' : ''} ${!hasValue ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'} ${className}`
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={selectClasses}
        {...props}
      >
        <option value="" disabled={required} className="text-slate-500 dark:text-slate-400">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-slate-900 dark:text-slate-100">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select