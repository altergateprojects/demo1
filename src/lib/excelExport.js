import * as XLSX from 'xlsx'
import { formatDate } from './formatters'

/**
 * Export expenses to Excel in Indian CA-friendly format
 */
export const exportExpensesToExcel = (expenses, academicYear, filters = {}) => {
  // Prepare data for Excel
  const data = []
  
  // Title rows
  data.push(['School Expenses Report'])
  data.push([`Academic Year: ${academicYear?.year_label || 'All Years'}`])
  data.push([`Generated on: ${formatDate(new Date())}`])
  data.push([]) // Empty row
  
  // Header row
  data.push([
    'Sr.No',
    'Date',
    'Voucher No',
    'Particulars',
    'Category',
    'Debit (₹)',
    'Credit (₹)',
    'Balance (₹)',
    'Payment Method',
    'Created By',
    'Status'
  ])
  
  // Data rows
  let runningBalance = 0
  expenses.forEach((expense, index) => {
    const amount = expense.amount_paise / 100
    runningBalance += amount
    
    // Check if updated
    const isUpdated = new Date(expense.updated_at) > new Date(expense.created_at)
    const status = isUpdated ? 'Updated' : '-'
    
    data.push([
      index + 1,
      formatDate(expense.expense_date),
      expense.reference_number || `EXP-${expense.id.slice(0, 8)}`,
      expense.description || '-',
      expense.category || '-',
      amount.toFixed(2),
      '-',
      runningBalance.toFixed(2),
      expense.payment_method || '-',
      expense.created_by_user?.full_name || '-',
      status
    ])
  })
  
  // Summary rows
  data.push([]) // Empty row
  data.push(['Summary'])
  data.push(['Total Expenses:', '', '', '', '', expenses.reduce((sum, e) => sum + (e.amount_paise / 100), 0).toFixed(2)])
  data.push(['Total Entries:', expenses.length])
  data.push(['Updated Entries:', expenses.filter(e => new Date(e.updated_at) > new Date(e.created_at)).length])
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Sr.No
    { wch: 12 }, // Date
    { wch: 15 }, // Voucher No
    { wch: 30 }, // Particulars
    { wch: 15 }, // Category
    { wch: 12 }, // Debit
    { wch: 12 }, // Credit
    { wch: 12 }, // Balance
    { wch: 15 }, // Payment Method
    { wch: 20 }, // Created By
    { wch: 10 }  // Status
  ]
  
  // Style header row (row 5, index 4)
  const headerRow = 4
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col })
    if (!ws[cellAddress]) continue
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'CCCCCC' } },
      alignment: { horizontal: 'center' }
    }
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
  
  // Generate filename
  const filename = `Expenses_${academicYear?.year_label || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`
  
  // Download file
  XLSX.writeFile(wb, filename)
  
  return filename
}

/**
 * Export expenses with detailed audit trail
 */
export const exportExpensesWithAudit = (expenses, academicYear) => {
  const data = []
  
  // Title
  data.push(['School Expenses - Detailed Audit Report'])
  data.push([`Academic Year: ${academicYear?.year_label || 'All Years'}`])
  data.push([`Generated on: ${formatDate(new Date())}`])
  data.push([])
  
  // Header
  data.push([
    'Sr.No',
    'Date',
    'Voucher No',
    'Description',
    'Category',
    'Amount (₹)',
    'Payment Method',
    'Created On',
    'Created By',
    'Last Updated',
    'Updated By',
    'Status',
    'Attachments'
  ])
  
  // Data
  expenses.forEach((expense, index) => {
    const isUpdated = new Date(expense.updated_at) > new Date(expense.created_at)
    
    data.push([
      index + 1,
      formatDate(expense.expense_date),
      expense.reference_number || `EXP-${expense.id.slice(0, 8)}`,
      expense.description || '-',
      expense.category || '-',
      (expense.amount_paise / 100).toFixed(2),
      expense.payment_method || '-',
      formatDate(expense.created_at),
      expense.created_by_user?.full_name || '-',
      isUpdated ? formatDate(expense.updated_at) : '-',
      expense.updated_by_user?.full_name || '-',
      isUpdated ? 'Modified' : 'Original',
      expense.attachment_url ? 'Yes' : 'No'
    ])
  })
  
  // Summary
  data.push([])
  data.push(['Total Expenses:', '', '', '', '', expenses.reduce((sum, e) => sum + (e.amount_paise / 100), 0).toFixed(2)])
  
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  ws['!cols'] = [
    { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
    { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 18 },
    { wch: 20 }, { wch: 12 }, { wch: 12 }
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses Audit')
  
  const filename = `Expenses_Audit_${academicYear?.year_label || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
  
  return filename
}
