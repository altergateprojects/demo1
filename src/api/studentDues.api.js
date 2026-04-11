import { supabase } from '../lib/supabase'

// Get student's total dues across all years
export const getStudentTotalDues = async (studentId) => {
  try {
    const { data, error } = await supabase.rpc('get_student_total_dues', {
      p_student_id: studentId
    })

    if (error) throw error
    return data || {
      student_id: studentId,
      current_year_fee_due: 0,
      current_year_pocket_money: 0,
      previous_year_dues: 0,
      exit_dues: 0,
      total_fee_due: 0,
      pocket_money_balance: 0,
      has_negative_pocket_money: false,
      total_amount_due: 0
    }
  } catch (error) {
    console.error('Error getting student total dues:', error)
    throw error
  }
}

// Get all student dues by academic year
export const getStudentDues = async (filters = {}) => {
  try {
    let query = supabase
      .from('student_dues')
      .select(`
        *,
        student:students(full_name, roll_number, standards(name)),
        academic_year:academic_years(year_label),
        created_by_user:user_profiles!created_by(full_name),
        cleared_by_user:user_profiles!cleared_by(full_name)
      `)
      .order('created_at', { ascending: false })

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId)
    }

    if (filters.academicYearId) {
      query = query.eq('academic_year_id', filters.academicYearId)
    }

    if (filters.dueType) {
      query = query.eq('due_type', filters.dueType)
    }

    if (filters.isCleared !== undefined) {
      query = query.eq('is_cleared', filters.isCleared)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting student dues:', error)
    return []
  }
}

// Get student promotions
export const getStudentPromotions = async (filters = {}) => {
  try {
    let query = supabase
      .from('student_promotions')
      .select(`
        *,
        student:students(full_name, roll_number),
        from_academic_year:academic_years!from_academic_year_id(year_label),
        to_academic_year:academic_years!to_academic_year_id(year_label),
        from_standard:standards!from_standard_id(name),
        to_standard:standards!to_standard_id(name),
        created_by_user:user_profiles!created_by(full_name)
      `)
      .order('promotion_date', { ascending: false })

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId)
    }

    if (filters.fromAcademicYearId) {
      query = query.eq('from_academic_year_id', filters.fromAcademicYearId)
    }

    if (filters.toAcademicYearId) {
      query = query.eq('to_academic_year_id', filters.toAcademicYearId)
    }

    if (filters.promotionType) {
      query = query.eq('promotion_type', filters.promotionType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting student promotions:', error)
    return []
  }
}

// Get students who left with dues
export const getStudentExitDues = async (filters = {}) => {
  try {
    let query = supabase
      .from('student_exit_dues')
      .select(`
        *,
        student:students(full_name, roll_number, standards(name)),
        created_by_user:user_profiles!created_by(full_name),
        cleared_by_user:user_profiles!cleared_by(full_name)
      `)
      .order('exit_date', { ascending: false })

    if (filters.isCleared !== undefined) {
      query = query.eq('is_cleared', filters.isCleared)
    }

    if (filters.exitReason) {
      query = query.eq('exit_reason', filters.exitReason)
    }

    if (filters.dateFrom) {
      query = query.gte('exit_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('exit_date', filters.dateTo)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting student exit dues:', error)
    return []
  }
}

// Promote student with dues tracking
export const promoteStudentWithDues = async ({
  studentId,
  toAcademicYearId,
  toStandardId,
  promotionType = 'promoted',
  notes = null
}) => {
  try {
    const { data, error } = await supabase.rpc('promote_student_with_dues', {
      p_student_id: studentId,
      p_to_academic_year_id: toAcademicYearId,
      p_to_standard_id: toStandardId,
      p_promotion_type: promotionType,
      p_notes: notes
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error promoting student:', error)
    throw error
  }
}

// Record student exit with dues
export const recordStudentExitWithDues = async ({
  studentId,
  exitReason,
  exitDate = new Date().toISOString().split('T')[0],
  notes = null
}) => {
  try {
    const { data, error } = await supabase.rpc('record_student_exit_with_dues', {
      p_student_id: studentId,
      p_exit_reason: exitReason,
      p_exit_date: exitDate,
      p_notes: notes
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error recording student exit:', error)
    throw error
  }
}

// Clear student dues
export const clearStudentDues = async (dueIds, paymentReference = null) => {
  try {
    const { data, error } = await supabase.rpc('clear_student_dues', {
      p_due_ids: dueIds,
      p_payment_reference: paymentReference
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error clearing student dues:', error)
    throw error
  }
}

// Create manual due entry
export const createStudentDue = async (dueData) => {
  try {
    const { data, error } = await supabase
      .from('student_dues')
      .insert({
        ...dueData,
        created_by: (await supabase.auth.getUser()).data.user?.id
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
    console.error('Error creating student due:', error)
    throw error
  }
}

// Update student due
export const updateStudentDue = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('student_dues')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating student due:', error)
    throw error
  }
}

// Add payment to a student due
export const addDuePayment = async (studentDueId, paymentData) => {
  try {
    const { data, error } = await supabase.rpc('add_student_due_payment', {
      p_student_due_id: studentDueId,
      p_payment_amount_paise: paymentData.payment_amount_paise,
      p_payment_date: paymentData.payment_date,
      p_payment_method: paymentData.payment_method,
      p_payment_reference: paymentData.payment_reference,
      p_notes: paymentData.notes
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding due payment:', error)
    throw error
  }
}

// Get payment history for a due
export const getDuePaymentHistory = async (studentDueId) => {
  try {
    const { data, error } = await supabase.rpc('get_student_due_payment_history', {
      p_student_due_id: studentDueId
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting payment history:', error)
    return []
  }
}

// Get payment summary for a student
export const getStudentPaymentSummary = async (studentId) => {
  try {
    const { data, error } = await supabase.rpc('get_student_payment_summary', {
      p_student_id: studentId
    })

    if (error) throw error
    return data?.[0] || {
      total_dues_paise: 0,
      total_paid_paise: 0,
      total_remaining_paise: 0,
      number_of_dues: 0,
      number_of_payments: 0
    }
  } catch (error) {
    console.error('Error getting payment summary:', error)
    throw error
  }
}

// Get dues summary statistics
export const getDuesSummaryStats = async (academicYearId = null) => {
  try {
    let query = supabase
      .from('student_dues')
      .select('due_type, amount_paise, amount_paid_paise, is_cleared, student_id')

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data: dues, error: duesError } = await query
    if (duesError) throw duesError

    const { data: exitDues, error: exitError } = await supabase
      .from('student_exit_dues')
      .select('total_due_paise, is_cleared')

    if (exitError) {
      console.error('❌ Error fetching exit dues:', exitError)
      // Don't throw - continue with empty exit dues
    }
    
    console.log('📊 Exit Dues Fetched:', {
      count: exitDues?.length || 0,
      data: exitDues
    })

    // Calculate statistics
    const stats = {
      total_pending_dues: 0,
      total_paid_amount: 0, // NEW: Total amount paid so far
      total_cleared_dues: 0, // Amount from fully cleared dues
      pending_fee_dues: 0,
      pending_pocket_money_dues: 0,
      cleared_fee_dues: 0,
      cleared_pocket_money_dues: 0,
      exit_dues_pending: 0,
      exit_dues_cleared: 0,
      total_students_with_dues: 0,
      total_students_with_exit_dues: 0
    }

    // Process regular dues
    dues?.forEach(due => {
      const amountPaid = due.amount_paid_paise || 0
      const remainingAmount = due.amount_paise - amountPaid
      
      // Add to total paid amount
      stats.total_paid_amount += amountPaid
      
      if (due.is_cleared) {
        stats.total_cleared_dues += due.amount_paise
        if (due.due_type === 'fee') {
          stats.cleared_fee_dues += due.amount_paise
        } else {
          stats.cleared_pocket_money_dues += due.amount_paise
        }
      } else {
        // Only count remaining amount as pending
        stats.total_pending_dues += remainingAmount
        if (due.due_type === 'fee') {
          stats.pending_fee_dues += remainingAmount
        } else {
          stats.pending_pocket_money_dues += remainingAmount
        }
      }
    })

    // Process exit dues
    exitDues?.forEach(exitDue => {
      if (exitDue.is_cleared) {
        stats.exit_dues_cleared += exitDue.total_due_paise
        stats.total_students_with_exit_dues++
      } else {
        stats.exit_dues_pending += exitDue.total_due_paise
        stats.total_students_with_exit_dues++
        // ADD EXIT DUES TO TOTAL PENDING
        stats.total_pending_dues += exitDue.total_due_paise
      }
    })
    
    console.log('📊 Stats Calculated:', {
      regular_dues_pending: stats.total_pending_dues - stats.exit_dues_pending,
      exit_dues_pending: stats.exit_dues_pending,
      total_pending_dues: stats.total_pending_dues,
      total_pending_rupees: (stats.total_pending_dues / 100).toFixed(2)
    })

    // Get unique student counts
    const uniqueStudentIds = new Set(dues?.filter(d => d.student_id).map(d => d.student_id) || [])
    stats.total_students_with_dues = uniqueStudentIds.size

    return stats
  } catch (error) {
    console.error('Error getting dues summary stats:', error)
    return {
      total_pending_dues: 0,
      total_cleared_dues: 0,
      pending_fee_dues: 0,
      pending_pocket_money_dues: 0,
      cleared_fee_dues: 0,
      cleared_pocket_money_dues: 0,
      exit_dues_pending: 0,
      exit_dues_cleared: 0,
      total_students_with_dues: 0,
      total_students_with_exit_dues: 0
    }
  }
}

/**
 * Add payment to exit due
 */
export const addExitDuePayment = async (exitDueId, paymentData) => {
  try {
    // For exit dues, we'll create a manual due entry and then pay it
    // This maintains consistency with the existing payment system
    
    // First, get the exit due details
    const { data: exitDue, error: exitError } = await supabase
      .from('student_exit_dues')
      .select('*')
      .eq('id', exitDueId)
      .single()

    if (exitError) throw exitError

    // Create manual due entries for the amounts being paid
    const dueEntries = []
    let remainingPayment = paymentData.payment_amount_paise

    // Create fee due if there's pending fee amount
    if (exitDue.pending_fee_paise > 0 && remainingPayment > 0) {
      const feePayment = Math.min(remainingPayment, exitDue.pending_fee_paise)
      
      const { data: feeDue, error: feeDueError } = await supabase
        .from('student_dues')
        .insert({
          student_id: exitDue.student_id,
          due_type: 'fee',
          amount_paise: feePayment,
          due_date: exitDue.exit_date,
          description: `Exit Due Payment - Fee (${exitDue.exit_reason})`,
          academic_year_id: null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (feeDueError) throw feeDueError
      
      dueEntries.push({ dueId: feeDue.id, amount: feePayment, type: 'fee' })
      remainingPayment -= feePayment
    }

    // Create pocket money due if there's pending pocket money and remaining payment
    if (exitDue.pending_pocket_money_paise < 0 && remainingPayment > 0) {
      const pocketPayment = Math.min(remainingPayment, Math.abs(exitDue.pending_pocket_money_paise))
      
      const { data: pocketDue, error: pocketDueError } = await supabase
        .from('student_dues')
        .insert({
          student_id: exitDue.student_id,
          due_type: 'pocket_money',
          amount_paise: pocketPayment,
          due_date: exitDue.exit_date,
          description: `Exit Due Payment - Pocket Money (${exitDue.exit_reason})`,
          academic_year_id: null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (pocketDueError) throw pocketDueError
      
      dueEntries.push({ dueId: pocketDue.id, amount: pocketPayment, type: 'pocket_money' })
      remainingPayment -= pocketPayment
    }

    // Now pay each due entry
    const paymentResults = []
    for (const entry of dueEntries) {
      const result = await addDuePayment(entry.dueId, {
        ...paymentData,
        payment_amount_paise: entry.amount
      })
      paymentResults.push({ ...result, type: entry.type })
    }

    // Update the exit due amounts
    const newPendingFee = Math.max(0, exitDue.pending_fee_paise - (dueEntries.find(e => e.type === 'fee')?.amount || 0))
    const newPendingPocket = Math.min(0, exitDue.pending_pocket_money_paise + (dueEntries.find(e => e.type === 'pocket_money')?.amount || 0))

    await supabase
      .from('student_exit_dues')
      .update({
        pending_fee_paise: newPendingFee,
        pending_pocket_money_paise: newPendingPocket,
        updated_at: new Date().toISOString()
      })
      .eq('id', exitDueId)

    return {
      success: true,
      payment_results: paymentResults,
      remaining_fee: newPendingFee,
      remaining_pocket: newPendingPocket,
      total_paid: paymentData.payment_amount_paise
    }

  } catch (error) {
    console.error('Error adding exit due payment:', error)
    throw error
  }
}