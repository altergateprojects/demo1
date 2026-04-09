import { supabase } from '../lib/supabase'

// Get all borrowed capital records
export const getBorrowedCapital = async (filters = {}) => {
  try {
    let query = supabase
      .from('borrowed_capital')
      .select('*')
      .eq('is_deleted', false)
      .order('borrowed_date', { ascending: false })

    if (filters.academicYearId) {
      query = query.eq('academic_year_id', filters.academicYearId)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting borrowed capital:', error)
    return []
  }
}

// Get single borrowed capital record
export const getBorrowedCapitalById = async (id) => {
  const { data, error } = await supabase
    .from('borrowed_capital')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data
}

// Create borrowed capital record
export const createBorrowedCapital = async (capitalData) => {
  const { data, error } = await supabase
    .from('borrowed_capital')
    .insert(capitalData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get repayments for borrowed capital
export const getBorrowedCapitalRepayments = async (borrowedCapitalId) => {
  const { data, error } = await supabase
    .from('borrowed_capital_repayments')
    .select('*')
    .eq('borrowed_capital_id', borrowedCapitalId)
    .eq('is_deleted', false)
    .order('repayment_date', { ascending: false })

  if (error) throw error
  return data || []
}

// Create repayment
export const createRepayment = async (repaymentData) => {
  const { data, error } = await supabase
    .from('borrowed_capital_repayments')
    .insert(repaymentData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get total active borrowed capital for academic year
export const getTotalActiveBorrowedCapital = async (academicYearId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_total_active_borrowed_capital', { p_academic_year_id: academicYearId })

    if (error) throw error
    return data || 0
  } catch (error) {
    console.error('Error getting total borrowed capital:', error)
    return 0
  }
}

// Get borrowed capital summary
export const getBorrowedCapitalSummary = async (academicYearId) => {
  try {
    const { data, error } = await supabase
      .from('borrowed_capital')
      .select('amount_paise, amount_repaid_paise, status')
      .eq('academic_year_id', academicYearId)
      .eq('is_deleted', false)

    if (error) throw error

    const summary = {
      totalBorrowed: 0,
      totalRepaid: 0,
      totalOutstanding: 0,
      activeCount: 0,
      fullyRepaidCount: 0
    }

    data.forEach(record => {
      summary.totalBorrowed += record.amount_paise
      summary.totalRepaid += record.amount_repaid_paise
      summary.totalOutstanding += (record.amount_paise - record.amount_repaid_paise)
      
      if (record.status === 'fully_repaid') {
        summary.fullyRepaidCount++
      } else if (record.status === 'active' || record.status === 'partially_repaid') {
        summary.activeCount++
      }
    })

    return summary
  } catch (error) {
    console.error('Error getting borrowed capital summary:', error)
    return {
      totalBorrowed: 0,
      totalRepaid: 0,
      totalOutstanding: 0,
      activeCount: 0,
      fullyRepaidCount: 0
    }
  }
}
