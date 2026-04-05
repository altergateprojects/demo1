import { supabase } from '../lib/supabase'

/**
 * Get all standards
 */
export const getStandards = async () => {
  const { data, error } = await supabase
    .from('standards')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Get all academic years
 */
export const getAcademicYears = async () => {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get current academic year
 */
export const getCurrentAcademicYear = async () => {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single()

  if (error) throw error
  return data
}

/**
 * Get school profile
 */
export const getSchoolProfile = async () => {
  const { data, error } = await supabase
    .from('school_profile')
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Update school profile
 */
export const updateSchoolProfile = async (updates) => {
  const user = (await supabase.auth.getUser()).data.user

  const { data, error } = await supabase
    .from('school_profile')
    .update({
      ...updates,
      updated_by: user.id
    })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error

  // Log audit trail
  await logAuditAction({
    actionType: 'UPDATE',
    entityType: 'school_profile',
    entityId: '1',
    entityLabel: 'School Profile',
    newValue: data,
    description: 'School profile updated'
  })

  return data
}

/**
 * Get system alerts
 */
export const getSystemAlerts = async (resolved = false) => {
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('is_resolved', resolved)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Resolve system alert
 */
export const resolveSystemAlert = async (alertId, resolutionNotes = '') => {
  const user = (await supabase.auth.getUser()).data.user

  const { data, error } = await supabase
    .from('system_alerts')
    .update({
      is_resolved: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes
    })
    .eq('id', alertId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create system alert
 */
export const createSystemAlert = async (alertData) => {
  const { data, error } = await supabase
    .from('system_alerts')
    .insert([alertData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get fee configurations
 */
export const getFeeConfigurations = async (academicYearId) => {
  const { data, error } = await supabase
    .from('fee_configurations')
    .select(`
      *,
      standards(name, sort_order),
      academic_years(year_label)
    `)
    .eq('academic_year_id', academicYearId)
    .order('standards.sort_order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Update fee configuration
 */
export const updateFeeConfiguration = async (id, updates) => {
  const { data, error } = await supabase
    .from('fee_configurations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Log audit trail
  await logAuditAction({
    actionType: 'UPDATE',
    entityType: 'fee_config',
    entityId: data.id,
    entityLabel: `Fee config updated`,
    newValue: data,
    description: `Fee configuration updated for ${data.standards?.name || 'standard'}`
  })

  return data
}

/**
 * Create fee configuration
 */
export const createFeeConfiguration = async (configData) => {
  const user = (await supabase.auth.getUser()).data.user

  const { data, error } = await supabase
    .from('fee_configurations')
    .insert([{
      ...configData,
      created_by: user.id
    }])
    .select()
    .single()

  if (error) throw error

  // Log audit trail
  await logAuditAction({
    actionType: 'CREATE',
    entityType: 'fee_config',
    entityId: data.id,
    entityLabel: `Fee config created`,
    newValue: data,
    description: `Fee configuration created`
  })

  return data
}

/**
 * Log audit action helper
 */
export const logAuditAction = async (auditData) => {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    await supabase.from('audit_logs').insert([{
      ...auditData,
      performed_by: user.id,
      performer_name: profile?.full_name || 'Unknown',
      performer_role: profile?.role || 'unknown'
    }])
  } catch (error) {
    console.error('Error logging audit action:', error)
  }
}

/**
 * Upload file to Supabase Storage
 */
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error
  return data
}

/**
 * Get signed URL for file
 */
export const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

/**
 * Delete file from storage
 */
export const deleteFile = async (bucket, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
  return data
}