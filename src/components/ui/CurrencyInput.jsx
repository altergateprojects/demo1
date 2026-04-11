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
    
    // Allow only numbers and one decimal point
    const cleanValue = inputValue.replace(/[^\d.]/g, '')
    
    // Prevent multiple decimal points
    const decimalCount = (cleanValue.match(/\./g) || []).length
    if (decimalCount > 1) {
      return // Don't update if multiple decimals
    }
    
    setDisplayValue(cleanValue)

    // Convert rupees to paise using PURE integer arithmetic
    if (cleanValue === '' || cleanValue === '.' || cleanValue === null || cleanValue === undefined) {
      onChange?.(0)
      return
    }

    // Split into rupees and paise parts
    const parts = cleanValue.split('.')
    const rupeesStr = parts[0] || '0'
    const paiseStr = parts[1] || '0'
    
    // Parse as integers ONLY - no floating point
    const rupees = parseInt(rupeesStr, 10) || 0
    
    // Handle paise: pad with zeros and take first 2 digits
    const paisePadded = (paiseStr + '00').substring(0, 2)
    const paise = parseInt(paisePadded, 10) || 0
    
    // Calculate total using PURE integer arithmetic
    // 10000 rupees = 10000 * 100 = 1000000 paise (EXACT)
    const totalPaise = (rupees * 100) + paise
    
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
          type="text"
          inputMode="decimal"
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