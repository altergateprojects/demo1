import { supabase } from '../lib/supabase'

// Financial Reports
export const getFinancialSummary = async (academicYearId, dateFrom, dateTo) => {
  try {
    // Get fee payments
    const { data: feePayments, error: feeError } = await supabase
      .from('fee_payments')
      .select('amount_paise')
      .eq('academic_year_id', academicYearId)
      .gte('payment_date', dateFrom)
      .lte('payment_date', dateTo)
      .eq('is_reversal', false)

    if (feeError) throw feeError

    // Get expenses
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('amount_paise')
      .eq('academic_year_id', academicYearId)
      .gte('expense_date', dateFrom)
      .lte('expense_date', dateTo)
      .eq('is_deleted', false)
      .eq('type', 'debit')

    // Don't throw error if expenses table doesn't exist, just use empty array
    const expensesData = expenseError ? [] : (expenses || [])

    // Calculate totals
    const totalIncome = feePayments?.reduce((sum, payment) => sum + (payment.amount_paise || 0), 0) || 0
    const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount_paise || 0), 0) || 0
    const netBalance = totalIncome - totalExpenses

    // Get total expected fees for collection rate
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('annual_fee_paise')
      .eq('academic_year_id', academicYearId)
      .eq('status', 'active')

    if (studentsError) throw studentsError

    const totalExpected = students?.reduce((sum, student) => sum + (student.annual_fee_paise || 0), 0) || 0
    const collectionRate = totalExpected > 0 ? Math.round((totalIncome / totalExpected) * 100) : 0

    return {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_balance: netBalance,
      collection_rate: collectionRate
    }
  } catch (error) {
    console.error('Error getting financial summary:', error)
    throw error
  }
}

export const getFeeCollectionReport = async (academicYearId, dateFrom, dateTo) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        roll_number,
        annual_fee_paise,
        fee_paid_paise,
        standard:standards(name, sort_order),
        fee_payments!inner(amount_paise, payment_date)
      `)
      .eq('academic_year_id', academicYearId)
      .eq('status', 'active')
      .gte('fee_payments.payment_date', dateFrom)
      .lte('fee_payments.payment_date', dateTo)
      .eq('fee_payments.is_reversal', false)

    if (error) throw error

    // Group by standard
    const standardGroups = {}
    
    data?.forEach(student => {
      const standardName = student.standard?.name || 'Unknown'
      if (!standardGroups[standardName]) {
        standardGroups[standardName] = {
          standard_name: standardName,
          sort_order: student.standard?.sort_order || 999,
          student_count: 0,
          expected_amount: 0,
          collected_amount: 0,
          pending_amount: 0,
          collection_percentage: 0
        }
      }
      
      const group = standardGroups[standardName]
      group.student_count += 1
      group.expected_amount += student.annual_fee_paise || 0
      group.collected_amount += student.fee_paid_paise || 0
    })

    // Calculate pending amounts and percentages
    Object.values(standardGroups).forEach(group => {
      group.pending_amount = group.expected_amount - group.collected_amount
      group.collection_percentage = group.expected_amount > 0 
        ? Math.round((group.collected_amount / group.expected_amount) * 100) 
        : 0
    })

    return Object.values(standardGroups).sort((a, b) => a.sort_order - b.sort_order)
  } catch (error) {
    console.error('Error getting fee collection report:', error)
    throw error
  }
}

export const getExpenseReport = async (academicYearId, dateFrom, dateTo) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount_paise')
      .eq('academic_year_id', academicYearId)
      .gte('expense_date', dateFrom)
      .lte('expense_date', dateTo)
      .eq('is_deleted', false)
      .eq('type', 'debit')

    // If expenses table doesn't exist or has error, return empty array
    if (error) {
      console.error('Error getting expense report:', error)
      return []
    }

    // Group by category
    const categoryGroups = {}
    let totalAmount = 0

    data?.forEach(expense => {
      const category = expense.category
      if (!categoryGroups[category]) {
        categoryGroups[category] = {
          category_name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          expense_count: 0,
          total_amount: 0
        }
      }
      
      categoryGroups[category].expense_count += 1
      categoryGroups[category].total_amount += expense.amount_paise || 0
      totalAmount += expense.amount_paise || 0
    })

    // Calculate averages and percentages
    return Object.values(categoryGroups).map(group => ({
      ...group,
      average_amount: group.expense_count > 0 ? Math.round(group.total_amount / group.expense_count) : 0,
      percentage: totalAmount > 0 ? Math.round((group.total_amount / totalAmount) * 100) : 0
    })).sort((a, b) => b.total_amount - a.total_amount)
  } catch (error) {
    console.error('Error getting expense report:', error)
    return []
  }
}

export const getStudentFeeStatus = async (academicYearId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        roll_number,
        annual_fee_paise,
        fee_paid_paise,
        standard:standards(name)
      `)
      .eq('academic_year_id', academicYearId)
      .eq('status', 'active')
      .order('full_name')

    if (error) throw error

    return data?.map(student => ({
      full_name: student.full_name,
      roll_number: student.roll_number,
      standard_name: student.standard?.name || 'Unknown',
      annual_fee: student.annual_fee_paise || 0,
      fee_paid: student.fee_paid_paise || 0,
      balance: (student.annual_fee_paise || 0) - (student.fee_paid_paise || 0)
    })) || []
  } catch (error) {
    console.error('Error getting student fee status:', error)
    throw error
  }
}

export const getTeacherSalaryReport = async (academicYearId, dateFrom, dateTo) => {
  try {
    // For now, return empty array since teacher salary system might not be fully implemented
    return []
  } catch (error) {
    console.error('Error getting teacher salary report:', error)
    throw error
  }
}

// Export Reports
export const exportReport = async (reportType, filters) => {
  try {
    // For now, return a success message
    // In a real implementation, this would generate and download files
    return { success: true, message: 'Export functionality coming soon' }
  } catch (error) {
    console.error('Error exporting report:', error)
    throw error
  }
}

// Audit Reports
export const getAuditReport = async (filters = {}) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100) // Limit to recent 100 records

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType)
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType)
    }

    if (filters.performedBy) {
      query = query.eq('performed_by', filters.performedBy)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting audit report:', error)
    throw error
  }
}

// Dashboard Analytics
export const getDashboardAnalytics = async (academicYearId) => {
  try {
    // Get basic counts and totals
    const [studentsResult, teachersResult, feePaymentsResult, expensesResult] = await Promise.all([
      supabase
        .from('students')
        .select('id, annual_fee_paise, fee_paid_paise')
        .eq('academic_year_id', academicYearId)
        .eq('status', 'active'),
      
      supabase
        .from('teachers')
        .select('id')
        .eq('status', 'active'),
      
      supabase
        .from('fee_payments')
        .select('amount_paise')
        .eq('academic_year_id', academicYearId)
        .eq('is_reversal', false),
      
      supabase
        .from('expenses')
        .select('amount_paise')
        .eq('academic_year_id', academicYearId)
        .eq('is_deleted', false)
        .eq('type', 'debit')
    ])

    const students = studentsResult.data || []
    const teachers = teachersResult.data || []
    const feePayments = feePaymentsResult.data || []
    const expenses = expensesResult.error ? [] : (expensesResult.data || [])

    const totalStudents = students.length
    const totalTeachers = teachers.length
    const totalFeeCollected = feePayments.reduce((sum, payment) => sum + (payment.amount_paise || 0), 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount_paise || 0), 0)
    const totalExpectedFees = students.reduce((sum, student) => sum + (student.annual_fee_paise || 0), 0)
    const totalFeePaid = students.reduce((sum, student) => sum + (student.fee_paid_paise || 0), 0)

    return {
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_fee_collected: totalFeeCollected,
      total_expenses: totalExpenses,
      total_expected_fees: totalExpectedFees,
      total_fee_paid: totalFeePaid,
      collection_rate: totalExpectedFees > 0 ? Math.round((totalFeePaid / totalExpectedFees) * 100) : 0,
      net_balance: totalFeeCollected - totalExpenses
    }
  } catch (error) {
    console.error('Error getting dashboard analytics:', error)
    throw error
  }
}