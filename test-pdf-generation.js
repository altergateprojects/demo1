// Test PDF Generation
// This is a simple test to check if PDF generation works

import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const testPDFGeneration = () => {
  try {
    console.log('Testing basic PDF generation...')
    
    const doc = new jsPDF()
    
    // Add simple content
    doc.setFontSize(20)
    doc.text('PDF Generation Test', 20, 20)
    
    doc.setFontSize(12)
    doc.text('This is a test PDF to verify jsPDF is working correctly.', 20, 40)
    
    // Add a simple table
    doc.autoTable({
      startY: 60,
      head: [['Field', 'Value']],
      body: [
        ['Test Field 1', 'Test Value 1'],
        ['Test Field 2', 'Test Value 2'],
        ['Test Field 3', 'Test Value 3']
      ],
      theme: 'grid'
    })
    
    // Generate blob
    const pdfBlob = doc.output('blob')
    console.log('PDF blob generated successfully, size:', pdfBlob.size, 'bytes')
    
    // Download test PDF
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pdf_test_${Date.now()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('Test PDF download completed successfully')
    return true
    
  } catch (error) {
    console.error('PDF generation test failed:', error)
    return false
  }
}

// Test with minimal student data
export const testStudentPDFGeneration = () => {
  try {
    console.log('Testing student PDF generation with minimal data...')
    
    const testStudentData = {
      student: {
        full_name: 'Test Student',
        roll_number: 'TEST001',
        gender: 'male',
        dob: '2010-01-01',
        guardian_name: 'Test Guardian',
        phone: '1234567890',
        address: 'Test Address',
        status: 'active',
        annual_fee_paise: 1000000, // ₹10,000
        fee_paid_paise: 500000,    // ₹5,000
        pocket_money_paise: 50000, // ₹500
        standards: { name: 'Class 5' },
        academic_years: { year_label: '2023-24' }
      },
      feePayments: [],
      studentDues: [],
      pocketMoneyTransactions: [],
      yearSnapshots: [],
      auditLogs: []
    }
    
    // Import the actual PDF generator
    import('./src/lib/pdfGenerator.js').then(({ downloadStudentDataPDF }) => {
      return downloadStudentDataPDF(testStudentData, 'test_student_pdf.pdf')
    }).then(() => {
      console.log('Student PDF test completed successfully')
    }).catch((error) => {
      console.error('Student PDF test failed:', error)
    })
    
  } catch (error) {
    console.error('Student PDF test setup failed:', error)
  }
}

// Add to window for testing in browser console
if (typeof window !== 'undefined') {
  window.testPDFGeneration = testPDFGeneration
  window.testStudentPDFGeneration = testStudentPDFGeneration
}