import { supabase } from '../lib/supabase'

/**
 * Get pocket money transactions for a student
 */
export const getPocketMoneyHistory = async (studentId) => {
  // Get transactions first
  const { data: transactions, error } = await supabase
    .from('pocket_money_transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  if (!transactions || transactions.length === 0) {
    return []
  }

  // Get unique user IDs
  const userIds = [...new Set(transactions.map(t => t.performed_by).filter(Boolean))]
  
  if (userIds.length === 0) {
    return transactions.map(t => ({ ...t, performed_by_user: null }))
  }

  // Get user profiles
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (profileError) {
    console.error('Error fetching user profiles:', profileError)
    return transactions.map(t => ({ ...t, performed_by_user: null }))
  }

  // Create lookup map
  const profileMap = {}
  profiles?.forEach(profile => {
    profileMap[profile.id] = profile
  })

  // Combine data
  return transactions.map(transaction => ({
    ...transaction,
    performed_by_user: profileMap[transaction.performed_by] || null
  }))
}

/**
 * Record pocket money transaction (allows negative balances for overdrafts)
 */
export const recordPocketMoneyTransaction = async (transactionData) => {
  const user = (await supabase.auth.getUser()).data.user
  const academicYear = await getCurrentAcademicYear()

  // Get current student info for logging
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('pocket_money_paise, full_name')
    .eq('id', transactionData.student_id)
    .single()

  if (studentError) throw studentError

  const currentBalance = student.pocket_money_paise || 0

  // Log overdraft warning if applicable
  if (transactionData.transaction_type === 'debit' && (currentBalance - transactionData.amount_paise) < 0) {
    const newBalance = currentBalance - transactionData.amount_paise
    console.log(`💳 Overdraft will occur for ${student.full_name}: Balance will be ₹${newBalance / 100}`)
  }

  const transaction = {
    ...transactionData,
    academic_year_id: academicYear.id,
    // Remove balance_after_paise - let the trigger handle balance updates
    performed_by: user.id,
    transaction_date: transactionData.transaction_date || new Date().toISOString().split('T')[0],
    description: transactionData.description || `Pocket money ${transactionData.transaction_type}`
  }

  // Insert transaction - the database trigger will update the student balance automatically
  const { data, error } = await supabase
    .from('pocket_money_transactions')
    .insert([transaction])
    .select(`
      *,
      students(full_name, roll_number, standards(name))
    `)
    .single()

  if (error) throw error

  // Get the updated balance after the trigger has run
  const { data: updatedStudent } = await supabase
    .from('students')
    .select('pocket_money_paise')
    .eq('id', transactionData.student_id)
    .single()

  const finalBalance = updatedStudent?.pocket_money_paise || 0

  // Enhanced audit trail with actual final balance
  const balanceInfo = finalBalance < 0 
    ? `Balance is now NEGATIVE: ₹${finalBalance / 100} (Overdraft)`
    : `New balance: ₹${finalBalance / 100}`

  await logAuditAction({
    actionType: 'CREATE',
    entityType: 'pocket_money',
    entityId: data.id,
    entityLabel: `${data.students.full_name} - ${transactionData.transaction_type} ₹${transactionData.amount_paise / 100}`,
    newValue: data,
    description: `Pocket money ${transactionData.transaction_type} of ₹${transactionData.amount_paise / 100} for ${data.students.full_name} (${data.students.roll_number}). ${balanceInfo}. ${transactionData.description || ''}`
  })

  return data
}

/**
 * Get pocket money summary for a student
 */
export const getPocketMoneySummary = async (studentId, academicYearId) => {
  const { data, error } = await supabase
    .from('pocket_money_transactions')
    .select('transaction_type, amount_paise')
    .eq('student_id', studentId)
    .eq('academic_year_id', academicYearId)

  if (error) throw error

  const summary = data.reduce((acc, transaction) => {
    if (transaction.transaction_type === 'credit') {
      acc.totalCredits += transaction.amount_paise
    } else {
      acc.totalDebits += transaction.amount_paise
    }
    acc.transactionCount++
    return acc
  }, {
    totalCredits: 0,
    totalDebits: 0,
    transactionCount: 0
  })

  summary.netBalance = summary.totalCredits - summary.totalDebits

  return summary
}

/**
 * Helper functions
 */
const getCurrentAcademicYear = async () => {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single()

  if (error) throw error
  return data
}

const logAuditAction = async (auditData) => {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return // Skip audit if no user
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    const auditEntry = {
      action_type: auditData.actionType,
      entity_type: auditData.entityType,
      entity_id: auditData.entityId,
      entity_label: auditData.entityLabel,
      performed_by: user.id,
      performer_name: profile?.full_name || user.email || 'Unknown',
      performer_role: profile?.role || 'unknown',
      old_value: auditData.oldValue || null,
      new_value: auditData.newValue || null,
      description: auditData.description
    }

    const { error } = await supabase.from('audit_logs').insert([auditEntry])
    if (error) {
      console.warn('Failed to log audit action:', error.message)
    }
  } catch (error) {
    console.warn('Error in audit logging:', error.message)
  }
}