import React, { useState, useEffect } from 'react'
import { formatINR } from '../../lib/formatters'

const CurrencyInput = ({ 
  label, 
  error, 
  helperText,
  value = 0, // value in paise
  onChange,
  className = '',
  required = false,
  disabled = false,
  ...props 
}) => {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    // Convert paise to rupees for display
    if (value !== null && value !== undefined) {
      const rupees = value / 100
      setDisplayValue(rupees.toString())
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)

    // Convert rupees to paise and call onChange
    const rupees = parseFloat(inputValue) || 0
    const paise = Math.round(rupees * 100)
    onChange?.(paise)
  }

  const handleBlur = () => {
    // Format the display value on blur
    if (displayValue && !isNaN(displayValue)) {
      const rupees = parseFloat(displayValue)
      setDisplayValue(rupees.toFixed(2))
    }
  }

  const inputClasses = `input-field pl-8 ${error ? 'border-red-300 dark:border-red-600' : ''} ${className}`
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-slate-500 dark:text-slate-400 text-sm">₹</span>
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputClasses}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="0.00"
          {...props}
        />
      </div>
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
      {value > 0 && !error && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Amount: {formatINR(value)}
        </p>
      )}
    </div>
  )
}

export default CurrencyInput