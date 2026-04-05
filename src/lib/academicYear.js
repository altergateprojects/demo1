import { format, addYears, startOfMonth, endOfMonth } from 'date-fns'
import { ACADEMIC_YEAR_START_MONTH } from './constants'

/**
 * Generate academic year label from start year
 * @param {number} startYear - Starting year of academic year
 * @returns {string} Academic year label (e.g., "2024-25")
 */
export const generateAcademicYearLabel = (startYear) => {
  const endYear = startYear + 1
  return `${startYear}-${endYear.toString().slice(-2)}`
}

/**
 * Get current academic year based on current date
 * @returns {string} Current academic year label
 */
export const getCurrentAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
  
  // If current month is before June, we're in the previous academic year
  const academicStartYear = currentMonth >= ACADEMIC_YEAR_START_MONTH ? currentYear : currentYear - 1
  
  return generateAcademicYearLabel(academicStartYear)
}

/**
 * Parse academic year label to get start and end years
 * @param {string} yearLabel - Academic year label (e.g., "2024-25")
 * @returns {object} Object with startYear and endYear
 */
export const parseAcademicYear = (yearLabel) => {
  const [startYear, endYearSuffix] = yearLabel.split('-')
  const startYearNum = parseInt(startYear, 10)
  const endYearNum = parseInt(`20${endYearSuffix}`, 10)
  
  return {
    startYear: startYearNum,
    endYear: endYearNum
  }
}

/**
 * Get academic year date range
 * @param {string} yearLabel - Academic year label
 * @returns {object} Object with startDate and endDate
 */
export const getAcademicYearDateRange = (yearLabel) => {
  const { startYear, endYear } = parseAcademicYear(yearLabel)
  
  // Academic year starts in June and ends in May
  const startDate = new Date(startYear, ACADEMIC_YEAR_START_MONTH - 1, 1) // June 1st
  const endDate = new Date(endYear, 4, 31) // May 31st
  
  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd')
  }
}

/**
 * Generate list of academic years around current year
 * @param {number} pastYears - Number of past years to include
 * @param {number} futureYears - Number of future years to include
 * @returns {Array} Array of academic year objects
 */
export const generateAcademicYearsList = (pastYears = 5, futureYears = 2) => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // Determine the current academic year start
  const currentAcademicStartYear = currentMonth >= ACADEMIC_YEAR_START_MONTH ? currentYear : currentYear - 1
  
  const years = []
  
  // Generate past years
  for (let i = pastYears; i > 0; i--) {
    const startYear = currentAcademicStartYear - i
    const yearLabel = generateAcademicYearLabel(startYear)
    const { startDate, endDate } = getAcademicYearDateRange(yearLabel)
    
    years.push({
      year_label: yearLabel,
      start_date: startDate,
      end_date: endDate,
      is_current: false
    })
  }
  
  // Add current year
  const currentYearLabel = generateAcademicYearLabel(currentAcademicStartYear)
  const currentRange = getAcademicYearDateRange(currentYearLabel)
  years.push({
    year_label: currentYearLabel,
    start_date: currentRange.startDate,
    end_date: currentRange.endDate,
    is_current: true
  })
  
  // Generate future years
  for (let i = 1; i <= futureYears; i++) {
    const startYear = currentAcademicStartYear + i
    const yearLabel = generateAcademicYearLabel(startYear)
    const { startDate, endDate } = getAcademicYearDateRange(yearLabel)
    
    years.push({
      year_label: yearLabel,
      start_date: startDate,
      end_date: endDate,
      is_current: false
    })
  }
  
  return years
}

/**
 * Check if a date falls within an academic year
 * @param {string} date - Date to check (YYYY-MM-DD)
 * @param {string} yearLabel - Academic year label
 * @returns {boolean} True if date is within the academic year
 */
export const isDateInAcademicYear = (date, yearLabel) => {
  const { startDate, endDate } = getAcademicYearDateRange(yearLabel)
  return date >= startDate && date <= endDate
}

/**
 * Get the next academic year label
 * @param {string} currentYearLabel - Current academic year label
 * @returns {string} Next academic year label
 */
export const getNextAcademicYear = (currentYearLabel) => {
  const { startYear } = parseAcademicYear(currentYearLabel)
  return generateAcademicYearLabel(startYear + 1)
}

/**
 * Get the previous academic year label
 * @param {string} currentYearLabel - Current academic year label
 * @returns {string} Previous academic year label
 */
export const getPreviousAcademicYear = (currentYearLabel) => {
  const { startYear } = parseAcademicYear(currentYearLabel)
  return generateAcademicYearLabel(startYear - 1)
}