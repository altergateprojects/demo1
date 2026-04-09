import { supabase } from '../lib/supabase'

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a student can be promoted to a target standard
 * @param {string} studentId - UUID of the student
 * @param {string} targetStandardId - UUID of the target standard
 * @param {string} targetAcademicYearId - UUID of the target academic year
 * @returns {Promise<{eligible: boolean, warnings: string[], errors: string[]}>}
 */
export const validatePromotion = async (studentId, targetStandardId, targetAcademicYearId) => {
  try {
    const { data, error } = await supabase.rpc('check_promotion_eligibility', {
      p_student_id: studentId,
      p_target_standard_id: targetStandardId,
      p_target_academic_year_id: targetAcademicYearId
    })

    if (error) throw error
    
    return data || {
      eligible: false,
      warnings: [],
      errors: ['Unknown validation error']
    }
  } catch (error) {
    console.error('Error validating promotion:', error)
    return {
      eligible: false,
      warnings: [],
      errors: [error.message || 'Failed to validate promotion']
    }
  }
}

// ============================================================================
// PROMOTION FUNCTIONS
// ============================================================================

/**
 * Promotes a single student
 * @param {Object} promotionData - Promotion details
 * @param {string} promotionData.studentId - UUID of the student
 * @param {string} promotionData.targetAcademicYearId - UUID of target academic year
 * @param {string} promotionData.targetStandardId - UUID of target standard (null for left_school/graduated)
 * @param {string} promotionData.promotionStatus - 'promoted' | 'repeated' | 'left_school' | 'graduated'
 * @param {string} promotionData.duesAction - 'carried_forward' | 'waived' | 'paid_before_promotion'
 * @param {string} promotionData.notes - Optional notes
 * @returns {Promise<{success: boolean, studentId: string, snapshotId: string, error?: string}>}
 */
export const promoteStudent = async ({
  studentId,
  targetAcademicYearId,
  targetStandardId,
  promotionStatus,
  duesAction,
  notes = null
}) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('promote_student_transaction', {
      p_student_id: studentId,
      p_target_academic_year_id: targetAcademicYearId,
      p_target_standard_id: targetStandardId,
      p_promotion_status: promotionStatus,
      p_dues_action: duesAction,
      p_promoted_by: user.id,
      p_notes: notes
    })

    if (error) throw error
    
    // Check if function returned error in result
    if (data && !data.success) {
      throw new Error(data.error || 'Promotion failed')
    }

    return data || {
      success: false,
      error: 'No response from server'
    }
  } catch (error) {
    console.error('Error promoting student:', error)
    return {
      success: false,
      studentId,
      error: error.message || 'Failed to promote student'
    }
  }
}

/**
 * Promotes multiple students in bulk
 * @param {Object} bulkData - Bulk promotion details
 * @param {string[]} bulkData.studentIds - Array of student UUIDs
 * @param {string} bulkData.targetAcademicYearId - UUID of target academic year
 * @param {string} bulkData.targetStandardId - UUID of target standard
 * @param {string} bulkData.promotionStatus - 'promoted' | 'repeated' | 'left_school' | 'graduated'
 * @param {string} bulkData.duesAction - 'carried_forward' | 'waived' | 'paid_before_promotion'
 * @param {string} bulkData.batchName - Optional batch name
 * @returns {Promise<{success: boolean, batchId: string, totalProcessed: number, successful: number, failed: number, results: Array}>}
 */
export const bulkPromoteStudents = async ({
  studentIds,
  targetAcademicYearId,
  targetStandardId,
  promotionStatus,
  duesAction,
  batchName = null
}) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('bulk_promote_students', {
      p_student_ids: studentIds,
      p_target_academic_year_id: targetAcademicYearId,
      p_target_standard_id: targetStandardId,
      p_promotion_status: promotionStatus,
      p_dues_action: duesAction,
      p_promoted_by: user.id,
      p_batch_name: batchName
    })

    if (error) throw error
    
    // Check if function returned error in result
    if (data && !data.success) {
      throw new Error(data.error || 'Bulk promotion failed')
    }

    return data || {
      success: false,
      error: 'No response from server'
    }
  } catch (error) {
    console.error('Error bulk promoting students:', error)
    return {
      success: false,
      totalProcessed: 0,
      successful: 0,
      failed: studentIds.length,
      error: error.message || 'Failed to bulk promote students',
      results: []
    }
  }
}

/**
 * Reverses a promotion (undo)
 * @param {string} studentId - UUID of the student
 * @param {string} promotionHistoryId - UUID of the promotion history record
 * @param {string} reason - Reason for reversal
 * @returns {Promise<{success: boolean, studentId: string, restoredYearId: string, restoredStandardId: string, error?: string}>}
 */
export const reversePromotion = async (studentId, promotionHistoryId, reason) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('reverse_promotion_transaction', {
      p_student_id: studentId,
      p_promotion_history_id: promotionHistoryId,
      p_reversed_by: user.id,
      p_reversal_reason: reason
    })

    if (error) throw error
    
    // Check if function returned error in result
    if (data && !data.success) {
      throw new Error(data.error || 'Reversal failed')
    }

    return data || {
      success: false,
      error: 'No response from server'
    }
  } catch (error) {
    console.error('Error reversing promotion:', error)
    return {
      success: false,
      studentId,
      error: error.message || 'Failed to reverse promotion'
    }
  }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Gets promotion history for a student
 * @param {string} studentId - UUID of the student
 * @returns {Promise<Array>} Array of promotion history records
 */
export const getPromotionHistory = async (studentId) => {
  try {
    const { data, error } = await supabase.rpc('get_promotion_history', {
      p_student_id: studentId
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting promotion history:', error)
    return []
  }
}

/**
 * Gets year-wise financial history for a student
 * @param {string} studentId - UUID of the student
 * @returns {Promise<Array>} Array of year-wise financial records
 */
export const getYearWiseFinancialHistory = async (studentId) => {
  try {
    const { data, error } = await supabase.rpc('get_year_wise_financial_history', {
      p_student_id: studentId
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting year-wise financial history:', error)
    return []
  }
}

/**
 * Gets complete financial summary for a student
 * @param {string} studentId - UUID of the student
 * @returns {Promise<Object>} Financial summary object
 */
export const getStudentFinancialSummary = async (studentId) => {
  try {
    const { data, error } = await supabase.rpc('get_student_financial_summary', {
      p_student_id: studentId
    })

    if (error) throw error
    
    return data || {
      student_id: studentId,
      current_year_dues_paise: 0,
      previous_years_dues_paise: 0,
      total_paid_paise: 0,
      pocket_money_paise: 0,
      total_pending_paise: 0
    }
  } catch (error) {
    console.error('Error getting student financial summary:', error)
    return {
      student_id: studentId,
      current_year_dues_paise: 0,
      previous_years_dues_paise: 0,
      total_paid_paise: 0,
      pocket_money_paise: 0,
      total_pending_paise: 0
    }
  }
}

/**
 * Gets dashboard dues summary (aggregated across all students)
 * @returns {Promise<Object>} Dashboard summary object
 */
export const getDashboardDuesSummary = async () => {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_dues_summary')

    if (error) throw error
    
    return data || {
      current_year_dues_paise: 0,
      previous_years_dues_paise: 0,
      exit_dues_paise: 0,
      total_pending_paise: 0,
      negative_pocket_money_paise: 0,
      negative_pocket_money_count: 0
    }
  } catch (error) {
    console.error('Error getting dashboard dues summary:', error)
    return {
      current_year_dues_paise: 0,
      previous_years_dues_paise: 0,
      exit_dues_paise: 0,
      total_pending_paise: 0,
      negative_pocket_money_paise: 0,
      negative_pocket_money_count: 0
    }
  }
}

/**
 * Gets students eligible for promotion
 * @param {string} academicYearId - UUID of the academic year
 * @param {string} standardId - Optional UUID of standard to filter by
 * @returns {Promise<Array>} Array of students with financial details
 */
export const getStudentsForPromotion = async (academicYearId, standardId = null) => {
  try {
    const { data, error } = await supabase.rpc('get_students_for_promotion', {
      p_academic_year_id: academicYearId,
      p_standard_id: standardId
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting students for promotion:', error)
    return []
  }
}

/**
 * Gets details for a promotion batch
 * @param {string} batchId - UUID of the batch
 * @returns {Promise<Array>} Array of batch details with student results
 */
export const getPromotionBatchDetails = async (batchId) => {
  try {
    const { data, error } = await supabase.rpc('get_promotion_batch_details', {
      p_batch_id: batchId
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting promotion batch details:', error)
    return []
  }
}

// ============================================================================
// TABLE QUERY FUNCTIONS (Direct table access)
// ============================================================================

/**
 * Gets all promotion batches with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of promotion batches
 */
export const getPromotionBatches = async (filters = {}) => {
  try {
    let query = supabase
      .from('promotion_batches')
      .select(`
        *,
        source_year:academic_years!source_academic_year_id(year_label),
        target_year:academic_years!target_academic_year_id(year_label),
        target_standard:standards(standard_name),
        created_by_user:user_profiles!created_by(full_name)
      `)
      .order('started_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.targetAcademicYearId) {
      query = query.eq('target_academic_year_id', filters.targetAcademicYearId)
    }

    if (filters.dateFrom) {
      query = query.gte('started_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('started_at', filters.dateTo)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting promotion batches:', error)
    return []
  }
}

/**
 * Gets year snapshots for a student
 * @param {string} studentId - UUID of the student
 * @returns {Promise<Array>} Array of year snapshots
 */
export const getStudentYearSnapshots = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('student_year_snapshots')
      .select(`
        *,
        academic_year:academic_years(year_label, start_date, end_date),
        standard:standards(standard_name),
        promoted_to_standard:standards!promoted_to_standard_id(standard_name),
        promoted_to_year:academic_years!promoted_to_academic_year_id(year_label),
        created_by_user:user_profiles!created_by(full_name)
      `)
      .eq('student_id', studentId)
      .order('snapshot_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting student year snapshots:', error)
    return []
  }
}

/**
 * Gets fee adjustments for a student
 * @param {string} studentId - UUID of the student
 * @param {string} academicYearId - Optional UUID of academic year to filter by
 * @returns {Promise<Array>} Array of fee adjustments
 */
export const getFeeAdjustments = async (studentId, academicYearId = null) => {
  try {
    let query = supabase
      .from('fee_adjustments')
      .select(`
        *,
        student:students(full_name, roll_number),
        academic_year:academic_years(year_label),
        approved_by_user:user_profiles!approved_by(full_name)
      `)
      .eq('student_id', studentId)
      .order('approved_at', { ascending: false })

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting fee adjustments:', error)
    return []
  }
}

/**
 * Creates a fee adjustment
 * @param {Object} adjustmentData - Fee adjustment details
 * @returns {Promise<Object>} Created fee adjustment
 */
export const createFeeAdjustment = async (adjustmentData) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('fee_adjustments')
      .insert({
        ...adjustmentData,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .select(`
        *,
        student:students(full_name, roll_number),
        academic_year:academic_years(year_label)
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating fee adjustment:', error)
    throw error
  }
}

/**
 * Updates a fee adjustment
 * @param {string} id - UUID of the fee adjustment
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated fee adjustment
 */
export const updateFeeAdjustment = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('fee_adjustments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating fee adjustment:', error)
    throw error
  }
}

/**
 * Deactivates a fee adjustment
 * @param {string} id - UUID of the fee adjustment
 * @returns {Promise<Object>} Updated fee adjustment
 */
export const deactivateFeeAdjustment = async (id) => {
  try {
    const { data, error } = await supabase
      .from('fee_adjustments')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error deactivating fee adjustment:', error)
    throw error
  }
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

/**
 * Gets promotion statistics for an academic year
 * @param {string} academicYearId - UUID of the academic year
 * @returns {Promise<Object>} Statistics object
 */
export const getPromotionStatistics = async (academicYearId) => {
  try {
    const { data, error } = await supabase
      .from('student_promotion_history')
      .select('promotion_status, is_reversed')
      .eq('to_academic_year_id', academicYearId)

    if (error) throw error

    const stats = {
      total_promotions: data?.length || 0,
      promoted: 0,
      repeated: 0,
      left_school: 0,
      graduated: 0,
      reversed: 0
    }

    data?.forEach(record => {
      if (record.is_reversed) {
        stats.reversed++
      } else {
        stats[record.promotion_status] = (stats[record.promotion_status] || 0) + 1
      }
    })

    return stats
  } catch (error) {
    console.error('Error getting promotion statistics:', error)
    return {
      total_promotions: 0,
      promoted: 0,
      repeated: 0,
      left_school: 0,
      graduated: 0,
      reversed: 0
    }
  }
}
