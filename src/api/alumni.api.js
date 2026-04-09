import { supabase } from '../lib/supabase'

/**
 * Get all alumni (graduated students)
 */
export const getAlumniList = async ({ search = '', academicYearId = null } = {}) => {
  try {
    let query = supabase
      .from('alumni_with_details')
      .select('*')

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%`)
    }

    if (academicYearId) {
      query = query.eq('final_academic_year_id', academicYearId)
    }

    const { data, error } = await query.order('graduation_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching alumni:', error)
    throw error
  }
}

/**
 * Get all students who left school
 */
export const getLeftSchoolList = async ({ search = '', academicYearId = null } = {}) => {
  try {
    let query = supabase
      .from('left_school_with_details')
      .select('*')

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%`)
    }

    if (academicYearId) {
      query = query.eq('last_academic_year_id', academicYearId)
    }

    const { data, error } = await query.order('exit_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching left school students:', error)
    throw error
  }
}

/**
 * Get alumni statistics
 */
export const getAlumniStats = async () => {
  try {
    const { count: alumniCount, error: alumniError } = await supabase
      .from('alumni_records')
      .select('*', { count: 'exact', head: true })

    const { count: leftSchoolCount, error: leftError } = await supabase
      .from('left_school_records')
      .select('*', { count: 'exact', head: true })

    if (alumniError) throw alumniError
    if (leftError) throw leftError

    return {
      total_alumni: alumniCount || 0,
      total_left_school: leftSchoolCount || 0
    }
  } catch (error) {
    console.error('Error fetching alumni stats:', error)
    throw error
  }
}

/**
 * Update alumni information (contact details, occupation, etc.)
 */
export const updateAlumniInfo = async (alumniId, updates) => {
  try {
    const { data, error } = await supabase
      .from('alumni_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', alumniId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating alumni info:', error)
    throw error
  }
}

/**
 * Update left school record information
 */
export const updateLeftSchoolInfo = async (recordId, updates) => {
  try {
    const { data, error } = await supabase
      .from('left_school_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating left school info:', error)
    throw error
  }
}

/**
 * Mark student as graduated (called from promotion)
 */
export const markStudentAsGraduated = async (studentId, data = {}) => {
  try {
    const { data: result, error } = await supabase.rpc('mark_student_as_graduated', {
      p_student_id: studentId,
      p_graduation_date: data.graduation_date || new Date().toISOString().split('T')[0],
      p_achievements: data.achievements || null,
      p_remarks: data.remarks || null
    })

    if (error) throw error
    return result
  } catch (error) {
    console.error('Error marking student as graduated:', error)
    throw error
  }
}

/**
 * Mark student as left school
 */
export const markStudentAsLeftSchool = async (studentId, data) => {
  try {
    const { data: result, error } = await supabase.rpc('mark_student_as_left_school', {
      p_student_id: studentId,
      p_exit_reason: data.exit_reason,
      p_exit_date: data.exit_date || new Date().toISOString().split('T')[0],
      p_remarks: data.remarks || null,
      p_tc_issued: data.transfer_certificate_issued || false,
      p_tc_number: data.transfer_certificate_number || null
    })

    if (error) throw error
    return result
  } catch (error) {
    console.error('Error marking student as left school:', error)
    throw error
  }
}
