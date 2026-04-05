import { supabase } from '../lib/supabase'

// Fee Configurations
export const getFeeConfigurations = async (academicYearId) => {
  try {
    console.log('Fetching fee configurations for academic year:', academicYearId)
    
    let query = supabase
      .from('fee_configurations')
      .select(`
        *,
        academic_year:academic_years(year_label),
        standard:standards(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // If academicYearId is provided, filter by it, otherwise get all
    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fee configurations error:', error)
      
      // Fallback query without joins if relationships fail
      console.log('Trying fallback query without joins...')
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('fee_configurations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        throw fallbackError
      }
      
      console.log('Fallback data:', fallbackData)
      return fallbackData || []
    }
    
    console.log('Fee configurations data:', data)
    return data || []
  } catch (error) {
    console.error('Error getting fee configurations:', error)
    
    // Final fallback - return empty array but don't throw
    return []
  }
}

export const createFeeConfiguration = async (feeConfig) => {
  const { data, error } = await supabase
    .from('fee_configurations')
    .insert(feeConfig)
    .select()
    .single()

  if (error) throw error

  // Update existing students' fees to match the new configuration
  try {
    await supabase.rpc('update_student_fees_from_config', {
      p_academic_year_id: feeConfig.academic_year_id,
      p_standard_id: feeConfig.standard_id,
      p_gender: feeConfig.gender === 'all' ? null : feeConfig.gender
    })
  } catch (updateError) {
    console.warn('Failed to update student fees automatically:', updateError)
    // Don't throw error here as the fee config was created successfully
  }

  return data
}

export const updateFeeConfiguration = async ({ id, updates }) => {
  // Get the current configuration to know which students to update
  const { data: currentConfig, error: fetchError } = await supabase
    .from('fee_configurations')
    .select('academic_year_id, standard_id, gender')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const { data, error } = await supabase
    .from('fee_configurations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Update existing students' fees to match the updated configuration
  try {
    await supabase.rpc('update_student_fees_from_config', {
      p_academic_year_id: currentConfig.academic_year_id,
      p_standard_id: currentConfig.standard_id,
      p_gender: currentConfig.gender === 'all' ? null : currentConfig.gender
    })
  } catch (updateError) {
    console.warn('Failed to update student fees automatically:', updateError)
    // Don't throw error here as the fee config was updated successfully
  }

  return data
}

export const deleteFeeConfiguration = async (id) => {
  const { error } = await supabase
    .from('fee_configurations')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// Fee Payments
export const getFeePayments = async (filters = {}) => {
  try {
    let query = supabase
      .from('fee_payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId)
    }

    if (filters.academicYearId) {
      query = query.eq('academic_year_id', filters.academicYearId)
    }

    if (filters.dateFrom) {
      query = query.gte('payment_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('payment_date', filters.dateTo)
    }

    if (filters.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fee payments error:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error getting fee payments:', error)
    return []
  }
}

export const createFeePayment = async (payment) => {
  const { data, error } = await supabase
    .from('fee_payments')
    .insert(payment)
    .select()
    .single()

  if (error) throw error
  return data
}

export const reverseFeePayment = async ({ id, reason, reversedBy }) => {
  const { data, error } = await supabase
    .from('fee_payments')
    .update({
      is_reversal: true,
      reversal_reason: reason,
      reversed_by: reversedBy,
      reversed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Fee Statistics
export const getFeeStatistics = async (academicYearId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_fee_statistics', { academic_year_id: academicYearId })

    if (error) {
      console.error('Fee statistics error:', error)
      // Return default statistics if function fails
      return {
        total_expected_paise: 0,
        total_collected_paise: 0,
        total_pending_paise: 0,
        students_paid: 0,
        collection_percentage: 0,
        payment_methods: []
      }
    }
    return data || {
      total_expected_paise: 0,
      total_collected_paise: 0,
      total_pending_paise: 0,
      students_paid: 0,
      collection_percentage: 0,
      payment_methods: []
    }
  } catch (error) {
    console.error('Error getting fee statistics:', error)
    return {
      total_expected_paise: 0,
      total_collected_paise: 0,
      total_pending_paise: 0,
      students_paid: 0,
      collection_percentage: 0,
      payment_methods: []
    }
  }
}

// Sync student fees with current fee configurations
export const syncStudentFeesWithConfigurations = async (academicYearId) => {
  try {
    const { data, error } = await supabase.rpc('update_student_fees_from_config', {
      p_academic_year_id: academicYearId
    })

    if (error) throw error
    return { updatedCount: data }
  } catch (error) {
    console.error('Error syncing student fees:', error)
    throw error
  }
}