import { supabase } from '../lib/supabase'

/**
 * Get teacher salary history
 */
export const getTeacherSalaryHistory = async (teacherId) => {
  const { data, error } = await supabase
    .from('teacher_salary_history')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('effective_date', { ascending: false })

  if (error) {
    console.error('Salary history error:', error)
    throw error
  }
  return data || []
}

/**
 * Create salary history record (for salary changes)
 */
export const createSalaryHistory = async (salaryData) => {
  const user = (await supabase.auth.getUser()).data.user
  const academicYear = await getCurrentAcademicYear()

  const salaryRecord = {
    ...salaryData,
    academic_year_id: academicYear.id,
    performed_by: user.id
  }

  const { data, error } = await supabase
    .from('teacher_salary_history')
    .insert([salaryRecord])
    .select('*')
    .single()

  if (error) throw error

  // Log audit action
  await logAuditAction({
    actionType: 'CREATE',
    entityType: 'teacher_salary',
    entityId: data.id,
    entityLabel: `Salary ${data.change_type}`,
    newValue: data,
    description: `Salary ${data.change_type}: ₹${data.new_salary_paise / 100} (${data.change_reason || 'No reason provided'})`
  })

  return data
}

/**
 * Get teacher bonuses
 */
export const getTeacherBonuses = async (teacherId, academicYearId = null) => {
  let query = supabase
    .from('teacher_bonuses')
    .select('*')
    .eq('teacher_id', teacherId)

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  query = query.order('bonus_date', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Create teacher bonus
 */
export const createTeacherBonus = async (bonusData) => {
  const user = (await supabase.auth.getUser()).data.user
  const academicYear = await getCurrentAcademicYear()

  const bonus = {
    ...bonusData,
    academic_year_id: academicYear.id,
    performed_by: user.id,
    approved_by: user.id // Auto-approve for now, can be changed later
  }

  const { data, error } = await supabase
    .from('teacher_bonuses')
    .insert([bonus])
    .select('*')
    .single()

  if (error) throw error

  // Log audit action
  await logAuditAction({
    actionType: 'CREATE',
    entityType: 'teacher_bonus',
    entityId: data.id,
    entityLabel: `${data.bonus_type} bonus`,
    newValue: data,
    description: `${data.bonus_type} bonus of ₹${data.amount_paise / 100}: ${data.reason}`
  })

  return data
}

/**
 * Update teacher bonus
 */
export const updateTeacherBonus = async (bonusId, updates) => {
  const { data, error } = await supabase
    .from('teacher_bonuses')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', bonusId)
    .select('*')
    .single()

  if (error) throw error

  // Log audit action
  await logAuditAction({
    actionType: 'UPDATE',
    entityType: 'teacher_bonus',
    entityId: data.id,
    entityLabel: `${data.bonus_type} bonus`,
    newValue: data,
    description: `Updated ${data.bonus_type} bonus`
  })

  return data
}

/**
 * Get teacher salary payments
 */
export const getTeacherSalaryPayments = async (teacherId, academicYearId = null) => {
  let query = supabase
    .from('teacher_salary_payments')
    .select('*')
    .eq('teacher_id', teacherId)

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  query = query.order('salary_month', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get all salary payments for a specific month
 */
export const getSalaryPaymentsByMonth = async (month) => {
  const { data, error } = await supabase
    .from('teacher_salary_payments')
    .select(`
      *,
      teachers(id, full_name, subject, current_salary_paise)
    `)
    .eq('salary_month', month + '-01')
    .eq('status', 'paid')

  if (error) throw error
  return data || []
}

/**
 * Create salary payment record
 */
export const createSalaryPayment = async (paymentData) => {
  const user = (await supabase.auth.getUser()).data.user
  const academicYear = await getCurrentAcademicYear()

  // Determine status based on whether it's a partial payment
  const status = paymentData.is_partial_payment ? 'partial' : 'paid'

  // Your table only has: base_salary_paise, bonus_amount_paise, deduction_amount_paise, total_amount_paise
  // So we need to simplify the data structure
  const payment = {
    teacher_id: paymentData.teacher_id,
    salary_month: paymentData.salary_month,
    payment_date: paymentData.payment_date,
    payment_method: paymentData.payment_method,
    reference_number: paymentData.reference_number || null,
    base_salary_paise: paymentData.base_salary_paise || 0,
    bonus_amount_paise: paymentData.bonus_amount_paise || 0,
    deduction_amount_paise: paymentData.deduction_amount_paise || 0,
    total_amount_paise: paymentData.total_amount_paise || 0,
    notes: paymentData.notes || null,
    status: status,
    academic_year_id: academicYear.id,
    performed_by: user.id
  }

  const { data, error } = await supabase
    .from('teacher_salary_payments')
    .insert([payment])
    .select('*')
    .single()

  if (error) throw error

  // Log audit action
  await logAuditAction({
    actionType: 'CREATE',
    entityType: 'teacher_salary_payment',
    entityId: data.id,
    entityLabel: `Salary Payment`,
    newValue: data,
    description: `${status === 'partial' ? 'Partial salary' : 'Salary'} payment of ₹${data.total_amount_paise / 100} (${new Date(data.salary_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`
  })

  return data
}

/**
 * Get teacher salary summary
 */
export const getTeacherSalarySummary = async (teacherId) => {
  const { data, error } = await supabase
    .from('teacher_salary_summary')
    .select('*')
    .eq('teacher_id', teacherId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get all teachers salary summary
 */
export const getAllTeachersSalarySummary = async () => {
  const { data, error } = await supabase
    .from('teacher_salary_summary')
    .select('*')
    .eq('teacher_status', 'active')
    .order('full_name')

  if (error) throw error
  return data || []
}

/**
 * Get salary statistics for dashboard
 */
export const getSalaryStatistics = async (academicYearId) => {
  // Get total salary expenses
  const { data: payments, error: paymentsError } = await supabase
    .from('teacher_salary_payments')
    .select('total_amount_paise')
    .eq('academic_year_id', academicYearId)
    .eq('status', 'paid')

  if (paymentsError) throw paymentsError

  // Get total bonuses
  const { data: bonuses, error: bonusesError } = await supabase
    .from('teacher_bonuses')
    .select('amount_paise')
    .eq('academic_year_id', academicYearId)
    .eq('status', 'approved')

  if (bonusesError) throw bonusesError

  // Get pending payments count
  const { count: pendingPayments, error: pendingError } = await supabase
    .from('teacher_salary_payments')
    .select('*', { count: 'exact', head: true })
    .eq('academic_year_id', academicYearId)
    .eq('status', 'pending')

  if (pendingError) throw pendingError

  const totalSalaryPaid = payments.reduce((sum, payment) => sum + payment.total_amount_paise, 0)
  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount_paise, 0)

  return {
    totalSalaryPaid,
    totalBonuses,
    totalExpenses: totalSalaryPaid + totalBonuses,
    pendingPayments: pendingPayments || 0
  }
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
    if (!user) return

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