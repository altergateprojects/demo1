import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatINR, formatDate, formatDateTime } from './formatters'

/**
 * Generate comprehensive student data PDF before deletion
 * @param {Object} studentData - Complete student data with all related records
 * @returns {Promise<Blob>} PDF blob
 */
export const generateStudentDataPDF = async (studentData) => {
  try {
    console.log('PDF Generator - Starting generation with data:', studentData)
    
    const {
      student,
      feePayments = [],
      studentDues = [],
      pocketMoneyTransactions = [],
      yearSnapshots = [],
      auditLogs = []
    } = studentData

    if (!student) {
      throw new Error('Student data is missing')
    }

    // Debug: Log the actual student data structure
    console.log('PDF Generator - Student data:', student)
    console.log('PDF Generator - Fee payments:', feePayments?.length || 0, 'records')
    console.log('PDF Generator - Student dues:', studentDues?.length || 0, 'records')
    console.log('PDF Generator - Pocket money transactions:', pocketMoneyTransactions?.length || 0, 'records')
    console.log('PDF Generator - Year snapshots:', yearSnapshots?.length || 0, 'records')

    const doc = new jsPDF()
    let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT DATA EXPORT', 105, yPosition, { align: 'center' })
  yPosition += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated on: ${formatDateTime(new Date().toISOString())}`, 105, yPosition, { align: 'center' })
  yPosition += 15

  // Student Basic Information
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT INFORMATION', 20, yPosition)
  yPosition += 10

  const studentInfo = [
    ['Full Name', student.full_name || '—'],
    ['Roll Number', student.roll_number || '—'],
    ['Standard', student.standards?.name || '—'],
    ['Gender', student.gender || '—'],
    ['Date of Birth', formatDate(student.dob) || '—'], // Fixed: was date_of_birth
    ['Guardian Name', student.guardian_name || '—'], // Fixed: was father_name/mother_name
    ['Phone Number', student.phone || '—'], // Fixed: was phone_number
    ['Address', student.address || '—'],
    ['Status', student.status || '—'],
    ['Academic Year', student.academic_years?.year_label || '—'],
    ['Admission Date', formatDate(student.admission_date) || formatDate(student.created_at) || '—']
  ]

  doc.autoTable({
    startY: yPosition,
    head: [['Field', 'Value']],
    body: studentInfo,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    margin: { left: 20, right: 20 }
  })

  yPosition = doc.lastAutoTable.finalY + 15

  // Financial Summary
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('FINANCIAL SUMMARY', 20, yPosition)
  yPosition += 10

  const financialInfo = [
    ['Annual Fee', formatINR(student.annual_fee_paise || 0)],
    ['Fee Paid', formatINR(student.fee_paid_paise || 0)],
    ['Current Year Pending', formatINR(Math.max(0, (student.annual_fee_paise || 0) - (student.fee_paid_paise || 0)))],
    ['Previous Years Pending', formatINR(student.previous_years_pending_paise || 0)],
    ['Total Pending', formatINR((student.previous_years_pending_paise || 0) + Math.max(0, (student.annual_fee_paise || 0) - (student.fee_paid_paise || 0)))],
    ['Pocket Money Balance', formatINR(student.pocket_money_paise || 0)]
  ]

  doc.autoTable({
    startY: yPosition,
    head: [['Financial Item', 'Amount']],
    body: financialInfo,
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80] },
    margin: { left: 20, right: 20 }
  })

  yPosition = doc.lastAutoTable.finalY + 15

  // Fee Payments History
  if (feePayments && feePayments.length > 0) {
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('FEE PAYMENTS HISTORY', 20, yPosition)
    yPosition += 10

    const paymentRows = feePayments.map(payment => [
      formatDate(payment.payment_date),
      payment.receipt_number || '—',
      formatINR(payment.amount_paise || 0),
      payment.payment_method?.replace('_', ' ') || '—',
      payment.reference_number || '—',
      payment.notes || '—'
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['Date', 'Receipt', 'Amount', 'Method', 'Reference', 'Notes']],
      body: paymentRows,
      theme: 'grid',
      headStyles: { fillColor: [255, 152, 0] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 }
    })

    yPosition = doc.lastAutoTable.finalY + 15
  } else {
    // Show "No fee payments" section
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('FEE PAYMENTS HISTORY', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('No fee payments recorded for this student.', 20, yPosition)
    yPosition += 20
  }

  // Student Dues History
  if (studentDues && studentDues.length > 0) {
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('STUDENT DUES HISTORY', 20, yPosition)
    yPosition += 10

    const duesRows = studentDues.map(due => [
      due.due_type || '—',
      formatINR(due.amount_paise || 0),
      formatDate(due.due_date),
      due.status || '—',
      formatDate(due.cleared_date) || '—',
      due.description || '—'
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['Type', 'Amount', 'Due Date', 'Status', 'Cleared Date', 'Description']],
      body: duesRows,
      theme: 'grid',
      headStyles: { fillColor: [156, 39, 176] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 }
    })

    yPosition = doc.lastAutoTable.finalY + 15
  } else {
    // Show "No student dues" section
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('STUDENT DUES HISTORY', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('No student dues recorded for this student.', 20, yPosition)
    yPosition += 20
  }

  // Pocket Money Transactions
  if (pocketMoneyTransactions && pocketMoneyTransactions.length > 0) {
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('POCKET MONEY TRANSACTIONS', 20, yPosition)
    yPosition += 10

    const transactionRows = pocketMoneyTransactions.map(txn => [
      formatDate(txn.transaction_date),
      txn.transaction_type || '—',
      formatINR(txn.amount_paise || 0),
      txn.description || '—',
      formatINR(txn.balance_after_paise || 0)
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['Date', 'Type', 'Amount', 'Description', 'Balance After']],
      body: transactionRows,
      theme: 'grid',
      headStyles: { fillColor: [233, 30, 99] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 }
    })

    yPosition = doc.lastAutoTable.finalY + 15
  } else {
    // Show "No pocket money transactions" section
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('POCKET MONEY TRANSACTIONS', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('No pocket money transactions recorded for this student.', 20, yPosition)
    yPosition += 20
  }

  // Year Snapshots (Promotion History)
  if (yearSnapshots && yearSnapshots.length > 0) {
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('ACADEMIC YEAR SNAPSHOTS', 20, yPosition)
    yPosition += 10

    const snapshotRows = yearSnapshots.map(snapshot => [
      snapshot.academic_years?.year_label || '—',
      snapshot.promotion_status || '—',
      formatINR(snapshot.fee_due_paise || 0),
      formatINR(snapshot.dues_carried_forward_paise || 0),
      formatINR(snapshot.pocket_money_paise || 0),
      formatDate(snapshot.snapshot_date)
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['Academic Year', 'Status', 'Fee Due', 'Carried Forward', 'Pocket Money', 'Date']],
      body: snapshotRows,
      theme: 'grid',
      headStyles: { fillColor: [103, 58, 183] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 }
    })

    yPosition = doc.lastAutoTable.finalY + 15
  } else {
    // Show "No year snapshots" section
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('ACADEMIC YEAR SNAPSHOTS', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('No academic year snapshots available for this student.', 20, yPosition)
    yPosition += 20
  }

  // Audit Logs (if available)
  if (auditLogs && auditLogs.length > 0) {
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('AUDIT LOGS (Last 50 entries)', 20, yPosition)
    yPosition += 10

    const auditRows = auditLogs.map(log => [
      formatDateTime(log.created_at),
      log.action_type || '—',
      log.entity_type || '—',
      log.description || '—'
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['Date/Time', 'Action', 'Entity', 'Description']],
      body: auditRows,
      theme: 'grid',
      headStyles: { fillColor: [244, 67, 54] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 7 }
    })

    yPosition = doc.lastAutoTable.finalY + 15
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' })
    doc.text('This document contains complete student data exported before deletion.', 105, 290, { align: 'center' })
  }

  console.log('PDF Generator - PDF generation completed successfully')
  return doc.output('blob')
  
  } catch (error) {
    console.error('PDF Generator - Error during generation:', error)
    throw new Error(`PDF generation failed: ${error.message}`)
  }
}

/**
 * Download student data as PDF
 * @param {Object} studentData - Complete student data
 * @param {string} filename - PDF filename
 */
export const downloadStudentDataPDF = async (studentData, filename) => {
  try {
    console.log('Starting PDF download process...')
    
    if (!studentData || !studentData.student) {
      throw new Error('Invalid student data provided')
    }
    
    const pdfBlob = await generateStudentDataPDF(studentData)
    
    if (!pdfBlob) {
      throw new Error('PDF generation returned empty result')
    }
    
    console.log('PDF blob generated, size:', pdfBlob.size, 'bytes')
    
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `student_data_${studentData.student.roll_number}_${Date.now()}.pdf`
    
    // Ensure the link is added to DOM for download to work in all browsers
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
    
    console.log('PDF download initiated successfully')
    
  } catch (error) {
    console.error('Error in PDF download process:', error)
    throw new Error(`Failed to generate PDF report: ${error.message}`)
  }
}