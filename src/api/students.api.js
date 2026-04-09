import { supabase } from '../lib/supabase'

/**
 * Get all students with pagination and filters (using optimized view)
 */
export const getStudents = async ({
  page = 1,
  limit = 25,
  search = '',
  standardId = '',
  status = '',
  gender = '',
  feeStatus = '',
  pocketMoneyStatus = '',
  academicYearId
}) => {
  try {
    console.log('Fetching students with params:', { page, limit, search, standardId, status, gender, feeStatus, pocketMoneyStatus, academicYearId })
    
    // First try the optimized view
    let query = supabase
      .from('students_with_fee_status')
      .select('*')

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%`)
    }

    if (standardId) {
      query = query.eq('standard_id', standardId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    } else if (!status) {
      // By default, only show active students (exclude graduated, withdrawn, left_school)
      query = query.eq('status', 'active')
    }
    // If status === 'all', don't add any status filter

    if (gender) {
      query = query.eq('gender', gender)
    }

    // Fee status filters (now using the calculated field)
    if (feeStatus) {
      query = query.eq('fee_status', feeStatus)
    }

    // Pocket money status filters (now using the calculated field)
    if (pocketMoneyStatus) {
      query = query.eq('pocket_money_status', pocketMoneyStatus)
    }

    // Get total count
    const { count, error: countError } = await query.select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.warn('Count query failed, falling back to basic students table:', countError.message)
      return await getStudentsBasic({
        page, limit, search, standardId, status, gender, feeStatus, pocketMoneyStatus, academicYearId
      })
    }

    // Get paginated data
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error } = await query
      .order('standard_sort_order', { ascending: true })
      .order('roll_number', { ascending: true })
      .range(from, to)

    if (error) {
      console.warn('View query failed, falling back to basic students table:', error.message)
      return await getStudentsBasic({
        page, limit, search, standardId, status, gender, feeStatus, pocketMoneyStatus, academicYearId
      })
    }

    // Transform data to match expected format
    const transformedData = data.map(student => ({
      ...student,
      standards: {
        name: student.standard_name,
        sort_order: student.standard_sort_order
      },
      academic_years: {
        year_label: student.academic_year_label
      }
    }))

    console.log('Students data fetched successfully:', transformedData.length, 'records')

    return {
      data: transformedData,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  } catch (error) {
    console.warn('Students view query failed, falling back to basic query:', error.message)
    return await getStudentsBasic({
      page, limit, search, standardId, status, gender, feeStatus, pocketMoneyStatus, academicYearId
    })
  }
}

/**
 * Fallback function using basic students table (original implementation)
 */
const getStudentsBasic = async ({
  page = 1,
  limit = 25,
  search = '',
  standardId = '',
  status = '',
  gender = '',
  feeStatus = '',
  pocketMoneyStatus = '',
  academicYearId
}) => {
  try {
    console.log('Using basic students query as fallback')
    
    let query = supabase
      .from('students')
      .select(`
        *,
        standards!inner(name, sort_order),
        academic_years!inner(year_label)
      `)
      .eq('is_deleted', false)

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%`)
    }

    if (standardId) {
      query = query.eq('standard_id', standardId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    } else if (!status) {
      // By default, only show active students (exclude graduated, withdrawn, left_school)
      query = query.eq('status', 'active')
    }
    // If status === 'all', don't add any status filter

    if (gender) {
      query = query.eq('gender', gender)
    }

    // Pocket money status filters (these work with simple comparisons)
    if (pocketMoneyStatus === 'negative') {
      query = query.lt('pocket_money_paise', 0)
    } else if (pocketMoneyStatus === 'zero') {
      query = query.eq('pocket_money_paise', 0)
    } else if (pocketMoneyStatus === 'positive') {
      query = query.gt('pocket_money_paise', 0)
    }

    // Get total count first
    const { count, error: countError } = await query.select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Basic count query failed:', countError)
      // Return empty result if even basic query fails
      return {
        data: [],
        count: 0,
        page: 1,
        limit: limit,
        totalPages: 0
      }
    }

    // Get paginated data
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error } = await query
      .order('roll_number', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Basic data query failed:', error)
      // Return empty result if query fails
      return {
        data: [],
        count: 0,
        page: 1,
        limit: limit,
        totalPages: 0
      }
    }

    console.log('Basic students data fetched:', data?.length || 0, 'records')

    // Apply fee status filtering in JavaScript (since Supabase can't compare columns directly)
    let filteredData = data || []
    if (feeStatus === 'pending') {
      filteredData = data.filter(student => student.annual_fee_paise > student.fee_paid_paise)
    } else if (feeStatus === 'paid') {
      filteredData = data.filter(student => student.annual_fee_paise <= student.fee_paid_paise)
    } else if (feeStatus === 'overpaid') {
      filteredData = data.filter(student => student.annual_fee_paise < student.fee_paid_paise)
    }

    // Sort by standard sort_order in JavaScript after fetching
    const sortedData = filteredData.sort((a, b) => {
      // First sort by standard sort_order
      const standardSort = (a.standards?.sort_order || 999) - (b.standards?.sort_order || 999)
      if (standardSort !== 0) return standardSort
      
      // Then by roll_number
      return a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true })
    })

    return {
      data: sortedData,
      count: filteredData.length, // Use filtered count
      page,
      limit,
      totalPages: Math.ceil(filteredData.length / limit)
    }
  } catch (error) {
    console.error('Complete fallback failed:', error)
    // Final fallback - return empty result
    return {
      data: [],
      count: 0,
      page: 1,
      limit: limit,
      totalPages: 0
    }
  }
}

/**
 * Get student by ID
 */
export const getStudentById = async (id) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      standards(name, sort_order),
      academic_years(year_label)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  
  // Calculate previous years pending from student_year_snapshots
  if (data) {
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('student_year_snapshots')
      .select('dues_carried_forward_paise')
      .eq('student_id', id)
    
    if (!snapshotsError && snapshots && snapshots.length > 0) {
      // Sum all dues_carried_forward_paise from snapshots (these are carried forward pending fees)
      const previousYearsPending = snapshots.reduce((sum, snapshot) => {
        return sum + (snapshot.dues_carried_forward_paise || 0)
      }, 0)
      
      data.previous_years_pending_paise = previousYearsPending
    } else {
      data.previous_years_pending_paise = 0
    }
  }
  
  return data
}

/**
 * Create new student
 */
export const createStudent = async (studentData) => {
  console.log('Creating student with data:', studentData)
  
  // First, get the fee configuration for this student
  const feeConfig = await getFeeConfigForStudent(
    studentData.academic_year_id,
    studentData.standard_id,
    studentData.gender
  )

  console.log('Fee config found:', feeConfig)

  const studentWithFee = {
    ...studentData,
    annual_fee_paise: feeConfig?.annual_fee_paise || 0,
    created_by: (await supabase.auth.getUser()).data.user?.id
  }

  console.log('Student data with fee:', studentWithFee)

  const { data, error } = await supabase
    .from('students')
    .insert([studentWithFee])
    .select(`
      *,
      standards(name, sort_order),
      academic_years(year_label)
    `)
    .single()

  if (error) throw error

  console.log('Student created successfully:', data)

  // Log audit trail
  await logAuditAction({
    actionType: 'CREATE',
    entityType: 'student',
    entityId: data.id,
    entityLabel: `${data.full_name} (${data.roll_number})`,
    newValue: data,
    description: `Student ${data.full_name} added with annual fee ${feeConfig?.annual_fee_paise ? `₹${feeConfig.annual_fee_paise / 100}` : '₹0'}`
  })

  return data
}

/**
 * Update student
 */
export const updateStudent = async (id, updates) => {
  // Get current data for audit
  const currentData = await getStudentById(id)

  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Log audit trail
  await logAuditAction({
    actionType: 'UPDATE',
    entityType: 'student',
    entityId: data.id,
    entityLabel: `${data.full_name} (${data.roll_number})`,
    oldValue: currentData,
    newValue: data,
    description: `Student ${data.full_name} updated`
  })

  return data
}

/**
 * Soft delete student
 */
export const deleteStudent = async (id, reason) => {
  const currentData = await getStudentById(id)

  const { data, error } = await supabase
    .from('students')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: (await supabase.auth.getUser()).data.user?.id,
      deletion_reason: reason
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Log audit trail
  await logAuditAction({
    actionType: 'SOFT_DELETE',
    entityType: 'student',
    entityId: data.id,
    entityLabel: `${currentData.full_name} (${currentData.roll_number})`,
    oldValue: currentData,
    newValue: data,
    description: `Student ${currentData.full_name} deleted. Reason: ${reason}`
  })

  return data
}

/**
 * Get fee configuration for student
 */
const getFeeConfigForStudent = async (academicYearId, standardId, gender) => {
  console.log('Looking for fee config:', { academicYearId, standardId, gender })
  
  // Try 'all' gender first (most common), then gender-specific
  let { data, error } = await supabase
    .from('fee_configurations')
    .select('*')
    .eq('academic_year_id', academicYearId)
    .eq('standard_id', standardId)
    .eq('gender', 'all')
    .eq('is_active', true)
    .single()

  if (error) {
    console.log('No "all" gender config found, trying gender-specific:', error.message)
    
    // Try gender-specific if 'all' doesn't exist
    const { data: genderSpecificConfig, error: genderError } = await supabase
      .from('fee_configurations')
      .select('*')
      .eq('academic_year_id', academicYearId)
      .eq('standard_id', standardId)
      .eq('gender', gender)
      .eq('is_active', true)
      .single()

    if (genderError) {
      console.error('No fee configuration found for:', { academicYearId, standardId, gender })
      return null
    }
    
    data = genderSpecificConfig
  }

  console.log('Found fee config:', data)
  return data
}

/**
 * Get student fee history
 */
export const getStudentFeeHistory = async (studentId) => {
  // First get the fee payments
  const { data: payments, error } = await supabase
    .from('fee_payments')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching fee history:', error)
    return []
  }

  if (!payments || payments.length === 0) {
    return []
  }

  // Get unique user IDs from received_by
  const userIds = [...new Set(payments.map(p => p.received_by).filter(Boolean))]
  
  if (userIds.length === 0) {
    return payments.map(p => ({ ...p, received_by_user: null }))
  }

  // Get user profiles for those IDs
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (profileError) {
    console.error('Error fetching user profiles:', profileError)
    return payments.map(p => ({ ...p, received_by_user: null }))
  }

  // Create a lookup map
  const profileMap = {}
  profiles?.forEach(profile => {
    profileMap[profile.id] = profile
  })

  // Combine the data
  return payments.map(payment => ({
    ...payment,
    received_by_user: profileMap[payment.received_by] || null
  }))
}

/**
 * Record fee payment
 */
export const recordFeePayment = async (paymentData) => {
  try {
    console.log('Starting smart fee payment recording:', paymentData)
    
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // Use the new smart payment function that handles previous years debt
    const { data, error } = await supabase.rpc('record_fee_payment_smart', {
      p_student_id: paymentData.student_id,
      p_amount_paise: paymentData.amount_paise,
      p_payment_method: paymentData.payment_method || 'cash',
      p_payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      p_notes: paymentData.notes || '',
      p_reference_number: paymentData.reference_number || null,
      p_bank_name: paymentData.bank_name || null
    })

    if (error) {
      console.error('Database error in smart payment:', error)
      throw error
    }
    
    console.log('Smart payment processed successfully:', data)

    // Get the updated student data to return
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        standards(name)
      `)
      .eq('id', paymentData.student_id)
      .single()

    if (studentError) {
      console.error('Error fetching updated student:', studentError)
      throw studentError
    }

    // Log audit trail with allocation details
    const allocation = data.allocation
    const auditDescription = `Smart fee payment of ₹${paymentData.amount_paise / 100} processed. ` +
      `Applied: ₹${allocation.applied_to_previous_years_paise / 100} to previous years, ` +
      `₹${allocation.applied_to_current_year_paise / 100} to current year, ` +
      `₹${allocation.added_to_pocket_money_paise / 100} to pocket money. ` +
      `Receipt: ${data.receipt_number}`

    await logAuditAction({
      actionType: 'CREATE',
      entityType: 'fee_payment_smart',
      entityId: data.payment_id,
      entityLabel: `${studentData.full_name} - ₹${paymentData.amount_paise / 100}`,
      newValue: data,
      description: auditDescription
    })

    // Return enhanced payment data
    return {
      id: data.payment_id,
      receipt_number: data.receipt_number,
      amount_paise: paymentData.amount_paise,
      allocation: data.allocation,
      balances_after_payment: data.balances_after_payment,
      student: studentData
    }
  } catch (error) {
    console.error('Error in smart fee payment:', error)
    throw error
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

const generateReceiptNumber = async (yearLabel) => {
  try {
    // Try to use the database function first
    const { data, error } = await supabase.rpc('generate_receipt_number', {
      academic_year: yearLabel
    })

    if (error) {
      console.warn('Database function failed, generating receipt number manually:', error)
      // Fallback: generate receipt number manually
      return await generateReceiptNumberManually(yearLabel)
    }
    
    return data
  } catch (error) {
    console.warn('RPC call failed, generating receipt number manually:', error)
    // Fallback: generate receipt number manually
    return await generateReceiptNumberManually(yearLabel)
  }
}

const generateReceiptNumberManually = async (yearLabel) => {
  // Get existing receipt numbers for this academic year
  const { data: existingReceipts, error } = await supabase
    .from('fee_payments')
    .select('receipt_number')
    .like('receipt_number', `RCPT-${yearLabel}-%`)
    .order('receipt_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching existing receipts:', error)
    // If we can't fetch existing receipts, start from 1
    return `RCPT-${yearLabel}-000001`
  }

  let nextNumber = 1
  if (existingReceipts && existingReceipts.length > 0) {
    const lastReceipt = existingReceipts[0].receipt_number
    const match = lastReceipt.match(/RCPT-.*-(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }

  // Format with leading zeros
  const paddedNumber = nextNumber.toString().padStart(6, '0')
  return `RCPT-${yearLabel}-${paddedNumber}`
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

/**
 * Get complete student data for PDF export before deletion
 */
export const getCompleteStudentData = async (studentId) => {
  try {
    console.log('Fetching complete student data for:', studentId)

    // Get student basic info with relations
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        standards(name, sort_order),
        academic_years(year_label)
      `)
      .eq('id', studentId)
      .single()

    if (studentError) throw studentError

    console.log('Complete student data fetched:', student)

    // Get previous years pending from snapshots
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('student_year_snapshots')
      .select('dues_carried_forward_paise')
      .eq('student_id', studentId)
    
    if (!snapshotsError && snapshots && snapshots.length > 0) {
      const previousYearsPending = snapshots.reduce((sum, snapshot) => {
        return sum + (snapshot.dues_carried_forward_paise || 0)
      }, 0)
      student.previous_years_pending_paise = previousYearsPending
    } else {
      student.previous_years_pending_paise = 0
    }

    // Get fee payments
    const { data: feePayments, error: paymentsError } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false })

    if (paymentsError) {
      console.warn('Error fetching fee payments:', paymentsError)
    } else {
      console.log('Fee payments fetched:', feePayments?.length || 0, 'records')
    }

    // Get student dues
    const { data: studentDues, error: duesError } = await supabase
      .from('student_dues')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: false })

    if (duesError) {
      console.warn('Error fetching student dues:', duesError)
    } else {
      console.log('Student dues fetched:', studentDues?.length || 0, 'records')
    }

    // Get pocket money transactions
    const { data: pocketMoneyTransactions, error: pocketError } = await supabase
      .from('pocket_money_transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('transaction_date', { ascending: false })

    if (pocketError) {
      console.warn('Error fetching pocket money transactions:', pocketError)
    } else {
      console.log('Pocket money transactions fetched:', pocketMoneyTransactions?.length || 0, 'records')
    }

    // Get year snapshots (promotion history)
    const { data: yearSnapshots, error: yearError } = await supabase
      .from('student_year_snapshots')
      .select(`
        *,
        academic_years(year_label)
      `)
      .eq('student_id', studentId)
      .order('snapshot_date', { ascending: false })

    if (yearError) {
      console.warn('Error fetching year snapshots:', yearError)
    } else {
      console.log('Year snapshots fetched:', yearSnapshots?.length || 0, 'records')
    }

    // Get audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', studentId)
      .order('created_at', { ascending: false })
      .limit(100) // Increased from 50 to 100 for more complete audit trail

    if (auditError) {
      console.warn('Error fetching audit logs:', auditError)
    } else {
      console.log('Audit logs fetched:', auditLogs?.length || 0, 'records')
    }

    const completeData = {
      student,
      feePayments: feePayments || [],
      studentDues: studentDues || [],
      pocketMoneyTransactions: pocketMoneyTransactions || [],
      yearSnapshots: yearSnapshots || [],
      auditLogs: auditLogs || []
    }

    console.log('Complete data structure for PDF:', {
      student: !!student,
      feePaymentsCount: completeData.feePayments.length,
      studentDuesCount: completeData.studentDues.length,
      pocketMoneyTransactionsCount: completeData.pocketMoneyTransactions.length,
      yearSnapshotsCount: completeData.yearSnapshots.length,
      auditLogsCount: completeData.auditLogs.length
    })

    return completeData
  } catch (error) {
    console.error('Error fetching complete student data:', error)
    throw error
  }
}

/**
 * Delete student and all related data (PERMANENT)
 */
export const deleteStudentCompletely = async (studentId, reason) => {
  try {
    console.log('Starting complete student deletion for:', studentId)
    
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      throw new Error('User not authenticated')
    }

    // First, check what references exist
    console.log('Checking student references...')
    const { data: references, error: refError } = await supabase.rpc('check_student_references', {
      p_student_id: studentId
    })

    if (!refError && references && references.length > 0) {
      console.log('Found references that need to be deleted:', references)
    }

    // Use RPC function for complete deletion
    const { data, error } = await supabase.rpc('delete_student_completely', {
      p_student_id: studentId,
      p_deletion_reason: reason,
      p_deleted_by: user.id
    })

    if (error) {
      console.error('Database error in student deletion:', error)
      
      // If regular deletion fails due to foreign keys, try force deletion
      if (error.message?.includes('foreign key') || error.message?.includes('Foreign key')) {
        console.log('Attempting force deletion with cascade...')
        
        const { data: forceData, error: forceError } = await supabase.rpc('force_delete_student_cascade', {
          p_student_id: studentId,
          p_deletion_reason: reason + ' (Force deleted due to foreign key constraints)',
          p_deleted_by: user.id
        })

        if (forceError) {
          throw new Error(`Force deletion also failed: ${forceError.message}`)
        }

        console.log('Force deletion successful:', forceData)
        return forceData
      }
      
      // Provide more specific error messages
      if (error.message?.includes('not found')) {
        throw new Error('Student not found in database')
      } else if (error.message?.includes('permission')) {
        throw new Error('You do not have permission to delete students')
      } else if (error.code === '42883') {
        throw new Error('Database function not found. Please contact administrator to set up the deletion system.')
      } else {
        throw new Error(`Database error: ${error.message || 'Unknown error occurred'}`)
      }
    }

    console.log('Student deleted completely:', data)

    // Log audit trail for deletion
    await logAuditAction({
      actionType: 'DELETE',
      entityType: 'student_complete',
      entityId: studentId,
      entityLabel: `Student ID: ${studentId}`,
      oldValue: { student_id: studentId },
      description: `Complete student deletion: ${reason}. All related data removed.`
    })

    return data
  } catch (error) {
    console.error('Error in complete student deletion:', error)
    throw error
  }
}