import { supabase } from '../lib/supabase'

/**
 * Get dashboard summary data
 */
export const getDashboardSummary = async (academicYearId) => {
  try {
    if (!academicYearId) {
      return {
        studentsCount: 0,
        teachersCount: 0,
        pendingFeesSum: 0,
        negativePocketMoneyCount: 0,
        totalNegativePocketMoney: 0,
        feesCollected: 0,
        totalPendingDues: 0,
        allYearsPendingFees: 0,
        totalOutstanding: 0
      }
    }

    // Get basic counts with individual error handling
    const results = await Promise.allSettled([
      getActiveStudentsCount(academicYearId),
      getActiveTeachersCount(),
      getPendingFeesSum(academicYearId),
      getNegativePocketMoneyStats(academicYearId),
      getFeesCollectedThisYear(academicYearId),
      getTotalPendingDues(),
      getAllYearsPendingFees(academicYearId)
    ])

    const [
      studentsResult,
      teachersResult,
      pendingFeesResult,
      negativePocketResult,
      feesCollectedResult,
      pendingDuesResult,
      allYearsFeesResult
    ] = results

    const negativePocketStats = negativePocketResult.status === 'fulfilled' 
      ? negativePocketResult.value 
      : { count: 0, total: 0 }

    const currentYearPendingFees = pendingFeesResult.status === 'fulfilled' ? pendingFeesResult.value : 0
    const previousYearsFees = allYearsFeesResult.status === 'fulfilled' ? allYearsFeesResult.value : 0
    const studentDues = pendingDuesResult.status === 'fulfilled' ? pendingDuesResult.value : 0

    const summary = {
      studentsCount: studentsResult.status === 'fulfilled' ? studentsResult.value : 0,
      teachersCount: teachersResult.status === 'fulfilled' ? teachersResult.value : 0,
      pendingFeesSum: currentYearPendingFees,
      negativePocketMoneyCount: negativePocketStats.count,
      totalNegativePocketMoney: negativePocketStats.total,
      feesCollected: feesCollectedResult.status === 'fulfilled' ? feesCollectedResult.value : 0,
      totalPendingDues: studentDues,
      allYearsPendingFees: previousYearsFees,
      totalOutstanding: currentYearPendingFees + previousYearsFees + studentDues
    }

    // Log any failed requests in development
    if (process.env.NODE_ENV === 'development') {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const functionNames = [
            'getActiveStudentsCount',
            'getActiveTeachersCount', 
            'getPendingFeesSum',
            'getNegativePocketMoneyStats',
            'getFeesCollectedThisYear',
            'getTotalPendingDues',
            'getAllYearsPendingFees'
          ]
          console.error(`❌ ${functionNames[index]} failed:`, result.reason)
        }
      })
    }

    return summary
  } catch (error) {
    console.error('❌ Error fetching dashboard summary:', error)
    throw error
  }
}

/**
 * Get active students count
 */
const getActiveStudentsCount = async (academicYearId) => {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('academic_year_id', academicYearId)
      .eq('status', 'active')
      .eq('is_deleted', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('❌ Error in getActiveStudentsCount:', error)
    return 0
  }
}

/**
 * Get active teachers count
 */
const getActiveTeachersCount = async () => {
  const { count, error } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_deleted', false)

  if (error) throw error
  return count || 0
}

/**
 * Get pending fees sum for CURRENT academic year only
 */
const getPendingFeesSum = async (academicYearId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('annual_fee_paise, fee_paid_paise')
      .eq('academic_year_id', academicYearId)
      .eq('status', 'active')
      .eq('is_deleted', false)

    if (error) throw error

    const pendingSum = data.reduce((sum, student) => {
      const pending = Math.max(0, student.annual_fee_paise - student.fee_paid_paise)
      return sum + pending
    }, 0)

    return pendingSum
  } catch (error) {
    console.error('❌ Error in getPendingFeesSum:', error)
    return 0
  }
}

/**
 * Get pending fees sum from ALL previous years (excluding current year)
 */
const getAllYearsPendingFees = async (currentAcademicYearId) => {
  try {
    // Get pending fees from ALL years except current year
    const { data, error } = await supabase
      .from('students')
      .select('annual_fee_paise, fee_paid_paise, academic_year_id')
      .neq('academic_year_id', currentAcademicYearId)
      .eq('status', 'active')
      .eq('is_deleted', false)

    if (error) throw error

    const pendingSum = data.reduce((sum, student) => {
      const pending = Math.max(0, student.annual_fee_paise - student.fee_paid_paise)
      return sum + pending
    }, 0)

    return pendingSum
  } catch (error) {
    console.error('❌ Error in getAllYearsPendingFees:', error)
    return 0
  }
}

/**
 * Get students with negative pocket money stats
 */
const getNegativePocketMoneyStats = async (academicYearId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('pocket_money_paise')
      .eq('academic_year_id', academicYearId)
      .eq('status', 'active')
      .eq('is_deleted', false)
      .lt('pocket_money_paise', 0)

    if (error) throw error

    const count = data?.length || 0
    const total = data?.reduce((sum, student) => sum + Math.abs(student.pocket_money_paise), 0) || 0
    
    return { count, total }
  } catch (error) {
    console.error('❌ Error in getNegativePocketMoneyStats:', error)
    return { count: 0, total: 0 }
  }
}

/**
 * Get fees collected this academic year
 */
const getFeesCollectedThisYear = async (academicYearId) => {
  const { data, error } = await supabase
    .from('fee_payments')
    .select('amount_paise')
    .eq('academic_year_id', academicYearId)
    .eq('is_reversal', false)

  if (error) throw error

  const totalCollected = data.reduce((sum, payment) => sum + payment.amount_paise, 0)
  return totalCollected
}

/**
 * Get critical alerts count
 */
const getCriticalAlertsCount = async () => {
  try {
    // Check for students with high pending fees or negative pocket money as "critical alerts"
    const { data: highPendingFees, error: feeError } = await supabase
      .from('students')
      .select('id, full_name, annual_fee_paise, fee_paid_paise')
      .eq('status', 'active')
      .eq('is_deleted', false)

    if (feeError) return 0

    // Count students with more than 50% pending fees as critical
    const criticalFeeStudents = highPendingFees.filter(student => {
      const pendingAmount = student.annual_fee_paise - student.fee_paid_paise
      const pendingPercentage = student.annual_fee_paise > 0 ? (pendingAmount / student.annual_fee_paise) * 100 : 0
      return pendingPercentage > 50
    })

    // Count students with negative pocket money
    const { count: negativePocketCount, error: pocketError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('is_deleted', false)
      .lt('pocket_money_paise', 0)

    if (pocketError) return criticalFeeStudents.length

    return criticalFeeStudents.length + (negativePocketCount || 0)
  } catch (error) {
    console.error('❌ Error in getCriticalAlertsCount:', error)
    return 0
  }
}

/**
 * Get total pending dues from student_dues table (all years)
 */
const getTotalPendingDues = async () => {
  try {
    // Get ALL dues - your table doesn't have a status column
    const { data, error } = await supabase
      .from('student_dues')
      .select('amount_paise, amount_paid_paise')

    if (error) {
      console.error('❌ Error fetching student dues:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No student dues found in database')
      return 0
    }

    // Calculate total remaining for all dues that aren't fully paid
    const totalPending = data.reduce((sum, due) => {
      const remaining = Math.max(0, due.amount_paise - (due.amount_paid_paise || 0))
      // Only count if there's remaining amount (not fully paid)
      if (remaining > 0) {
        return sum + remaining
      }
      return sum
    }, 0)

    console.log('📊 Student Dues Debug:', {
      totalDues: data.length,
      totalPendingPaise: totalPending,
      totalPendingRupees: (totalPending / 100).toFixed(2),
      sampleDues: data.slice(0, 5).map(d => ({
        amount: (d.amount_paise / 100).toFixed(2),
        paid: ((d.amount_paid_paise || 0) / 100).toFixed(2),
        remaining: (Math.max(0, d.amount_paise - (d.amount_paid_paise || 0)) / 100).toFixed(2)
      }))
    })

    return totalPending
  } catch (error) {
    console.error('❌ Error in getTotalPendingDues:', error)
    return 0
  }
}

/**
 * Get standard-wise fee summary
 */
export const getStandardFeeSummary = async (academicYearId) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      standard_id,
      gender,
      annual_fee_paise,
      fee_paid_paise,
      status,
      standards!inner(name, sort_order)
    `)
    .eq('academic_year_id', academicYearId)
    .eq('is_deleted', false)

  if (error) throw error

  // Group by standard
  const summary = data.reduce((acc, student) => {
    const standardName = student.standards.name
    const sortOrder = student.standards.sort_order

    if (!acc[standardName]) {
      acc[standardName] = {
        standardName,
        sortOrder,
        activeStudents: 0,
        maleCount: 0,
        femaleCount: 0,
        totalAnnualFee: 0,
        totalPaid: 0,
        totalPending: 0
      }
    }

    if (student.status === 'active') {
      acc[standardName].activeStudents++
      if (student.gender === 'male') acc[standardName].maleCount++
      if (student.gender === 'female') acc[standardName].femaleCount++
      acc[standardName].totalAnnualFee += student.annual_fee_paise
      acc[standardName].totalPaid += student.fee_paid_paise
      acc[standardName].totalPending += Math.max(0, student.annual_fee_paise - student.fee_paid_paise)
    }

    return acc
  }, {})

  return Object.values(summary).sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Get recent activity
 */
export const getRecentActivity = async (limit = 10) => {
  // Get audit logs first
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  
  if (!logs || logs.length === 0) {
    return []
  }

  // Get unique user IDs
  const userIds = [...new Set(logs.map(log => log.performed_by).filter(Boolean))]
  
  if (userIds.length === 0) {
    return logs.map(log => ({ ...log, user_profiles: null }))
  }

  // Get user profiles
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (profileError) {
    console.error('Error fetching user profiles:', profileError)
    return logs.map(log => ({ ...log, user_profiles: null }))
  }

  // Create lookup map
  const profileMap = {}
  profiles?.forEach(profile => {
    profileMap[profile.id] = profile
  })

  // Combine data
  return logs.map(log => ({
    ...log,
    user_profiles: profileMap[log.performed_by] || null
  }))
}

/**
 * Get monthly fee collection trend
 */
export const getMonthlyFeeCollectionTrend = async (academicYearId, months = 6) => {
  const { data, error } = await supabase
    .from('fee_payments')
    .select('amount_paise, payment_date')
    .eq('academic_year_id', academicYearId)
    .eq('is_reversal', false)
    .gte('payment_date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('payment_date', { ascending: true })

  if (error) throw error

  // Group by month
  const monthlyData = data.reduce((acc, payment) => {
    const month = payment.payment_date.substring(0, 7) // YYYY-MM
    if (!acc[month]) {
      acc[month] = 0
    }
    acc[month] += payment.amount_paise
    return acc
  }, {})

  return Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount
  }))
}