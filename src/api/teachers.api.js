import { supabase } from '../lib/supabase'

/**
 * Get all teachers with pagination and filtering
 */
export const getTeachers = async ({ 
  page = 1, 
  limit = 25, 
  search = '', 
  status = 'all',
  sortBy = 'full_name',
  sortOrder = 'asc' 
} = {}) => {
  let query = supabase
    .from('teachers')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Apply search filter
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    teachers: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page
  }
}

/**
 * Get a single teacher by ID
 */
export const getTeacher = async (id) => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new teacher
 */
export const createTeacher = async (teacherData) => {
  const user = (await supabase.auth.getUser()).data.user

  const teacher = {
    ...teacherData,
    created_by: user?.id
  }

  const { data, error } = await supabase
    .from('teachers')
    .insert([teacher])
    .select()
    .single()

  if (error) throw error

  // Log audit action
  await logAuditAction({
    actionType: 'CREATE',
    entityType: 'teacher',
    entityId: data.id,
    entityLabel: data.full_name,
    newValue: data,
    description: `Created teacher: ${data.full_name}`
  })

  return data
}

/**
 * Update a teacher
 */
export const updateTeacher = async (id, updates) => {
  const { data, error } = await supabase
    .from('teachers')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Log audit action
  await logAuditAction({
    actionType: 'UPDATE',
    entityType: 'teacher',
    entityId: data.id,
    entityLabel: data.full_name,
    newValue: data,
    description: `Updated teacher: ${data.full_name}`
  })

  return data
}

/**
 * Delete a teacher (soft delete)
 */
export const deleteTeacher = async (id) => {
  const { data, error } = await supabase
    .from('teachers')
    .update({
      is_deleted: true,
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Log audit action
  await logAuditAction({
    actionType: 'DELETE',
    entityType: 'teacher',
    entityId: data.id,
    entityLabel: data.full_name,
    description: `Deleted teacher: ${data.full_name}`
  })

  return data
}

/**
 * Get teachers summary statistics
 */
export const getTeachersSummary = async () => {
  const { data, error } = await supabase
    .from('teachers')
    .select('status')
    .eq('is_deleted', false)

  if (error) throw error

  const summary = data.reduce((acc, teacher) => {
    acc.total++
    if (teacher.status === 'active') acc.active++
    if (teacher.status === 'inactive') acc.inactive++
    return acc
  }, { total: 0, active: 0, inactive: 0 })

  return summary
}

/**
 * Helper function to log audit actions
 */
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