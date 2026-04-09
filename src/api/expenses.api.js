import { supabase } from '../lib/supabase'

// Expenses
export const getExpenses = async (filters = {}) => {
  try {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        attachment_count:expense_attachments(count)
      `)
      .eq('is_deleted', false)
      .order('expense_date', { ascending: false })

    if (filters.academicYearId) {
      query = query.eq('academic_year_id', filters.academicYearId)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.dateFrom) {
      query = query.gte('expense_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('expense_date', filters.dateTo)
    }

    if (filters.needsApproval !== undefined && filters.needsApproval !== '') {
      query = query.eq('needs_approval', filters.needsApproval === 'true')
    }

    if (filters.isApproved !== undefined && filters.isApproved !== '') {
      if (filters.isApproved === 'null') {
        query = query.is('is_approved', null)
      } else {
        query = query.eq('is_approved', filters.isApproved === 'true')
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Transform the data to include attachment count
    const transformedData = (data || []).map(expense => ({
      ...expense,
      attachmentCount: expense.attachment_count?.[0]?.count || 0
    }))

    return transformedData
  } catch (error) {
    console.error('Error getting expenses:', error)
    // Return empty array instead of throwing to prevent UI crashes
    return []
  }
}

export const getExpense = async (id) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting expense:', error)
    throw error
  }
}

export const createExpense = async (expense) => {
  try {
    // Separate fields that might not exist in the current table structure
    const { attachments, created_ip, created_user_agent, change_reason, ...expenseData } = expense
    
    console.log('Creating expense with data:', expenseData)
    
    // Create the expense record with only basic fields that definitely exist
    const { data: expenseRecord, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (expenseError) {
      console.error('Supabase error creating expense:', expenseError)
      throw expenseError
    }

    console.log('Expense created successfully:', expenseRecord)

    // Try to create audit trail entry if the table exists
    if (change_reason) {
      try {
        const { error: auditError } = await supabase
          .from('expense_audit_trail')
          .insert({
            expense_id: expenseRecord.id,
            action_type: 'CREATE',
            change_reason: change_reason,
            performed_by: expenseData.recorded_by,
            ip_address: created_ip,
            user_agent: created_user_agent
          })

        if (auditError) {
          console.warn('Failed to create audit trail (table may not exist):', auditError)
        }
      } catch (auditError) {
        console.warn('Audit trail table not available:', auditError)
      }
    }

    // Try to create attachment records if the table exists
    if (attachments && attachments.length > 0) {
      try {
        const attachmentRecords = attachments.map(attachment => ({
          expense_id: expenseRecord.id,
          file_name: attachment.file_name,
          file_size: attachment.file_size,
          file_type: attachment.file_type,
          file_extension: attachment.file_extension,
          storage_path: attachment.storage_path,
          file_hash: attachment.file_hash,
          uploaded_by: attachment.uploaded_by
        }))

        const { error: attachmentError } = await supabase
          .from('expense_attachments')
          .insert(attachmentRecords)

        if (attachmentError) {
          console.warn('Failed to create attachment records (table may not exist):', attachmentError)
        }
      } catch (attachmentError) {
        console.warn('Attachment table not available:', attachmentError)
      }
    }

    return expenseRecord
  } catch (error) {
    console.error('Error creating expense:', error)
    throw error
  }
}

export const updateExpense = async ({ id, updates }) => {
  try {
    // Remove ALL audit-related fields that don't belong in the expenses table
    const { 
      audit_changes, 
      audit_reason, 
      modified_by, 
      modified_ip, 
      modified_user_agent,
      change_reason,  // This was causing the error!
      ...expenseUpdates 
    } = updates
    
    console.log('=== UPDATE EXPENSE DEBUG ===')
    console.log('Expense ID:', id)
    console.log('Clean updates to apply:', expenseUpdates)
    console.log('Audit changes:', audit_changes)
    console.log('Audit reason:', audit_reason)
    console.log('Modified by:', modified_by)
    
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Expense updated successfully:', data)

    // Try to create audit trail entries for the update if tables exist
    if (audit_reason && audit_changes && audit_changes.length > 0) {
      console.log('Creating audit trail entries...')
      try {
        for (const change of audit_changes) {
          console.log('Creating audit entry for change:', change)
          const auditEntry = {
            expense_id: id,
            action_type: 'UPDATE',
            field_name: change.field,
            old_value: String(change.oldValue),
            new_value: String(change.newValue),
            change_reason: audit_reason,
            performed_by: modified_by,
            ip_address: modified_ip,
            user_agent: modified_user_agent
          }
          
          console.log('Audit entry data:', auditEntry)
          
          const result = await createAuditTrailEntry(auditEntry)
          console.log('Audit entry created:', result)
        }
        console.log('All audit entries created successfully')
      } catch (auditError) {
        console.error('Failed to create audit trail:', auditError)
        // Don't throw - let the update succeed even if audit fails
      }
    } else {
      console.log('No audit trail to create:', { audit_reason, audit_changes })
    }

    return data
  } catch (error) {
    console.error('Error updating expense:', error)
    throw error
  }
}

export const deleteExpense = async ({ id, reason, deletedBy }) => {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
      deletion_reason: reason
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const approveExpense = async ({ id, approvedBy, notes }) => {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      is_approved: true,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      approval_notes: notes
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const rejectExpense = async ({ id, approvedBy, notes }) => {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      is_approved: false,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      approval_notes: notes
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Expense Attachments
export const getExpenseAttachments = async (expenseId) => {
  try {
    const { data, error } = await supabase
      .from('expense_attachments')
      .select('*')
      .eq('expense_id', expenseId)
      .eq('is_deleted', false)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.warn('Attachments table not available:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.warn('Error getting expense attachments (table may not exist):', error)
    return []
  }
}

export const createExpenseAttachment = async (attachment) => {
  try {
    const { data, error } = await supabase
      .from('expense_attachments')
      .insert(attachment)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating expense attachment:', error)
    throw error
  }
}

// Expense Audit Trail
export const getExpenseAuditTrail = async (expenseId) => {
  try {
    // Use simple query without user profile joins to avoid 400 errors
    const { data, error } = await supabase
      .from('expense_audit_trail')
      .select('*')
      .eq('expense_id', expenseId)
      .order('performed_at', { ascending: false })
    
    if (error) {
      console.error('Audit trail query error:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error getting expense audit trail:', error)
    return []
  }
}

export const createAuditTrailEntry = async (auditEntry) => {
  try {
    console.log('=== CREATING AUDIT TRAIL ENTRY ===')
    console.log('Audit entry data:', auditEntry)
    
    const { data, error } = await supabase
      .from('expense_audit_trail')
      .insert(auditEntry)
      .select()
      .single()

    if (error) {
      console.error('Audit trail creation error:', error)
      throw error
    }
    
    console.log('Audit trail entry created successfully:', data)
    return data
  } catch (error) {
    console.error('Error creating audit trail entry:', error)
    throw error
  }
}

// Lock/Unlock Expense
export const lockExpense = async ({ id, lockedBy, reason }) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: lockedBy
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Create audit trail entry
    await createAuditTrailEntry({
      expense_id: id,
      action_type: 'LOCK',
      change_reason: reason || 'Expense locked for security',
      performed_by: lockedBy
    })

    return data
  } catch (error) {
    console.error('Error locking expense:', error)
    throw error
  }
}

// Expense Statistics
export const getExpenseStatistics = async (academicYearId) => {
  const { data, error } = await supabase
    .rpc('get_expense_statistics', { academic_year_id: academicYearId })

  if (error) throw error
  return data
}

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { value: 'construction_repair', label: 'Construction & Repair' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'cleaning_sanitation', label: 'Cleaning & Sanitation' },
  { value: 'security', label: 'Security' },
  { value: 'transport', label: 'Transport' },
  { value: 'events_programs', label: 'Events & Programs' },
  { value: 'government_fees', label: 'Government Fees' },
  { value: 'staff_welfare', label: 'Staff Welfare' },
  { value: 'medical_firstaid', label: 'Medical & First Aid' },
  { value: 'library', label: 'Library' },
  { value: 'technology', label: 'Technology' },
  { value: 'sports_equipment', label: 'Sports Equipment' },
  { value: 'bank_charges', label: 'Bank Charges' },
  { value: 'audit_fees', label: 'Audit Fees' },
  { value: 'legal_fees', label: 'Legal Fees' },
  { value: 'miscellaneous', label: 'Miscellaneous' }
]