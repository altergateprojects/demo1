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
    // Convert paise to rupees for display using integer arithmetic
    if (value !== null && value !== undefined && value >= 0) {
      const rupees = Math.floor(value / 100)
      const paise = value % 100
      const displayRupees = paise > 0 ? `${rupees}.${paise.toString().padStart(2, '0')}` : rupees.toString()
      setDisplayValue(displayRupees)
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)

    // Convert rupees to paise using integer arithmetic to avoid floating-point errors
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      onChange?.(0)
      return
    }

    // Parse the input value and handle decimal places properly
    const numericValue = parseFloat(inputValue)
    if (isNaN(numericValue)) {
      onChange?.(0)
      return
    }

    // Convert to paise using integer arithmetic
    // First, split into rupees and paise parts
    const parts = inputValue.split('.')
    const rupees = parseInt(parts[0]) || 0
    const paisePart = parts[1] ? parseInt((parts[1] + '00').substring(0, 2)) : 0
    
    const totalPaise = (rupees * 100) + paisePart
    onChange?.(totalPaise)
  }

  const handleBlur = () => {
    // Format the display value on blur using integer arithmetic
    if (displayValue && !isNaN(displayValue)) {
      const parts = displayValue.split('.')
      const rupees = parseInt(parts[0]) || 0
      const paisePart = parts[1] ? parseInt((parts[1] + '00').substring(0, 2)) : 0
      
      if (paisePart > 0) {
        setDisplayValue(`${rupees}.${paisePart.toString().padStart(2, '0')}`)
      } else {
        setDisplayValue(rupees.toString())
      }
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