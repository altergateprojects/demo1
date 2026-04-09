import { supabase } from '../lib/supabase'

/**
 * Reverse a fee payment (creates a negative entry)
 */
export const reverseFeePayment = async (paymentId, reversalReason, reversedBy) => {
  try {
    const { data, error } = await supabase.rpc('reverse_fee_payment', {
      p_payment_id: paymentId,
      p_reversal_reason: reversalReason,
      p_reversed_by: reversedBy
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error reversing fee payment:', error)
    throw error
  }
}

/**
 * Correct a fee payment (reverse old + create new)
 */
export const correctFeePayment = async (paymentId, correctionData) => {
  try {
    const { data, error } = await supabase.rpc('correct_fee_payment', {
      p_payment_id: paymentId,
      p_correction_reason: correctionData.correction_reason,
      p_new_student_id: correctionData.new_student_id,
      p_new_amount_paise: correctionData.new_amount_paise,
      p_new_payment_date: correctionData.new_payment_date,
      p_new_payment_method: correctionData.new_payment_method,
      p_corrected_by: correctionData.corrected_by,
      p_new_reference_number: correctionData.new_reference_number || null,
      p_new_bank_name: correctionData.new_bank_name || null
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error correcting fee payment:', error)
    throw error
  }
}

/**
 * Get payment history with reversals for a student
 */
export const getPaymentHistoryWithReversals = async (studentId, academicYearId = null) => {
  try {
    const { data, error } = await supabase.rpc('get_payment_history_with_reversals', {
      p_student_id: studentId,
      p_academic_year_id: academicYearId
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching payment history:', error)
    throw error
  }
}

/**
 * Get a single fee payment by ID
 */
export const getFeePaymentById = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('fee_payments')
      .select(`
        *,
        student:students(id, full_name, roll_number),
        academic_year:academic_years(id, year_label)
      `)
      .eq('id', paymentId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching fee payment:', error)
    throw error
  }
}

/**
 * Check if a payment can be reversed/corrected
 */
export const canReversePayment = async (paymentId) => {
  try {
    const { data: payment, error: paymentError } = await supabase
      .from('fee_payments')
      .select('is_reversal, reversed_payment_id')
      .eq('id', paymentId)
      .single()

    if (paymentError) throw paymentError

    // Cannot reverse a reversal
    if (payment.is_reversal) {
      return { can_reverse: false, reason: 'Cannot reverse a reversal payment' }
    }

    // Check if already reversed
    const { data: reversals, error: reversalError } = await supabase
      .from('fee_payments')
      .select('id')
      .eq('reversed_payment_id', paymentId)
      .eq('is_reversal', true)

    if (reversalError) throw reversalError

    if (reversals && reversals.length > 0) {
      return { can_reverse: false, reason: 'This payment has already been reversed' }
    }

    return { can_reverse: true }
  } catch (error) {
    console.error('Error checking if payment can be reversed:', error)
    throw error
  }
}
