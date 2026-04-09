import { format, parseISO } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const IST_TIMEZONE = 'Asia/Kolkata'

/**
 * Format paise to Indian Rupee currency format
 * @param {number} paise - Amount in paise (₹1 = 100 paise)
 * @returns {string} Formatted currency string
 */
export const formatINR = (paise) => {
  if (paise === null || paise === undefined || isNaN(paise)) return '—'
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees)
}

/**
 * Format date to DD/MM/YYYY format in IST
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (isoString) => {
  if (!isoString) return '—'
  try {
    const date = parseISO(isoString)
    const istDate = utcToZonedTime(date, IST_TIMEZONE)
    return format(istDate, 'dd/MM/yyyy')
  } catch (error) {
    return '—'
  }
}

/**
 * Format datetime to DD/MM/YYYY HH:mm:ss format in IST
 * @param {string} isoString - ISO datetime string
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '—'
  try {
    const date = parseISO(isoString)
    const istDate = utcToZonedTime(date, IST_TIMEZONE)
    return format(istDate, 'dd/MM/yyyy HH:mm:ss')
  } catch (error) {
    return '—'
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string} isoString - ISO datetime string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (isoString) => {
  if (!isoString) return '—'
  try {
    const date = parseISO(isoString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays} days ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `${diffInMonths} months ago`
    
    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} years ago`
  } catch (error) {
    return '—'
  }
}

/**
 * Convert amount in paise to words (Indian format)
 * @param {number} paise - Amount in paise
 * @returns {string} Amount in words
 */
export const amountInWords = (paise) => {
  if (!paise || paise === 0) return 'Zero Rupees Only'
  
  let rupees = Math.floor(paise / 100)
  const paiseRemainder = paise % 100
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  const convertHundreds = (num) => {
    let result = ''
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred '
      num %= 100
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' '
      num %= 10
    } else if (num >= 10) {
      result += teens[num - 10] + ' '
      return result
    }
    if (num > 0) {
      result += ones[num] + ' '
    }
    return result
  }
  
  let result = ''
  
  // Handle crores
  if (rupees >= 10000000) {
    result += convertHundreds(Math.floor(rupees / 10000000)) + 'Crore '
    rupees %= 10000000
  }
  
  // Handle lakhs
  if (rupees >= 100000) {
    result += convertHundreds(Math.floor(rupees / 100000)) + 'Lakh '
    rupees %= 100000
  }
  
  // Handle thousands
  if (rupees >= 1000) {
    result += convertHundreds(Math.floor(rupees / 1000)) + 'Thousand '
    rupees %= 1000
  }
  
  // Handle remaining hundreds, tens, and ones
  if (rupees > 0) {
    result += convertHundreds(rupees)
  }
  
  result += 'Rupees'
  
  if (paiseRemainder > 0) {
    result += ' and ' + convertHundreds(paiseRemainder) + 'Paise'
  }
  
  result += ' Only'
  
  return result.replace(/\s+/g, ' ').trim()
}

/**
 * Format phone number for Indian mobile numbers
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '—'
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // If it's a 10-digit number, format as Indian mobile
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  
  // If it already has country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  
  return phone
}

/**
 * Format percentage with Indian locale
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format number with Indian locale (lakhs, crores)
 * @param {number} value - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}

/**
 * Convert rupees to paise safely using integer arithmetic to avoid floating-point errors
 * @param {string|number} rupees - Amount in rupees (can be string like "500" or "500.50")
 * @returns {number} Amount in paise (integer)
 * 
 * Examples:
 * - rupeesToPaise(500) => 50000
 * - rupeesToPaise("500") => 50000
 * - rupeesToPaise("500.50") => 50050
 * - rupeesToPaise("500.5") => 50050
 * - rupeesToPaise("500.05") => 50005
 */
export const rupeesToPaise = (rupees) => {
  if (rupees === null || rupees === undefined || rupees === '') return 0
  
  // Convert to string to handle both string and number inputs
  const rupeesStr = String(rupees).trim()
  
  // Handle invalid inputs
  if (rupeesStr === '' || isNaN(parseFloat(rupeesStr))) return 0
  
  // Split into rupees and paise parts
  const parts = rupeesStr.split('.')
  const rupeesPart = parseInt(parts[0]) || 0
  
  // Handle paise part (decimal places)
  let paisePart = 0
  if (parts[1]) {
    // Take only first 2 decimal places and pad with zeros if needed
    const paiseStr = (parts[1] + '00').substring(0, 2)
    paisePart = parseInt(paiseStr) || 0
  }
  
  // Calculate total paise using integer arithmetic (no floating-point multiplication)
  const totalPaise = (rupeesPart * 100) + paisePart
  
  return totalPaise
}

/**
 * Convert paise to rupees safely
 * @param {number} paise - Amount in paise
 * @returns {number} Amount in rupees (as decimal number)
 */
export const paiseToRupees = (paise) => {
  if (paise === null || paise === undefined || isNaN(paise)) return 0
  return paise / 100
}