// Simple PDF Generation Test
// Run this in browser console to test PDF generation

const testPDFGeneration = async () => {
  try {
    console.log('Testing PDF generation...')
    
    // Mock student data for testing
    const mockStudentData = {
      student: {
        id: 'test-id',
        full_name: 'Test Student',
        roll_number: 'TEST001',
        gender: 'male',
        dob: '2010-01-01',
        guardian_name: 'Test Guardian',
        phone: '1234567890',
        address: 'Test Address',
        status: 'active',
        annual_fee_paise: 500000, // ₹5000
        fee_paid_paise: 300000,   // ₹3000
        pocket_money_paise: 50000, // ₹500
        previous_years_pending_paise: 100000, // ₹1000
        standards: { name: 'Class 10' },
        academic_years: { year_label: '2024-25' },
        admission_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z'
      },
      feePayments: [
        {
          payment_date: '2024-01-15',
          receipt_number: 'RCPT-2024-25-000001',
          amount_paise: 300000,
          payment_method: 'cash',
          reference_number: null,
          notes: 'First installment'
        }
      ],
      studentDues: [],
      pocketMoneyTransactions: [
        {
          transaction_date: '2024-01-10',
          transaction_type: 'credit',
          amount_paise: 50000,
          description: 'Initial pocket money',
          balance_after_paise: 50000
        }
      ],
      yearSnapshots: [],
      auditLogs: [
        {
          created_at: '2024-01-01T00:00:00Z',
          action_type: 'CREATE',
          entity_type: 'student',
          description: 'Student created'
        }
      ]
    }
    
    // Import the PDF generator (adjust path as needed)
    const { generateStudentDataPDF } = await import('./src/lib/pdfGenerator.js')
    
    console.log('Generating PDF with mock data...')
    const pdfBlob = await generateStudentDataPDF(mockStudentData)
    
    console.log('PDF generated successfully! Size:', pdfBlob.size, 'bytes')
    
    // Download the test PDF
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'test_student_pdf.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('✅ PDF generation test PASSED')
    return true
    
  } catch (error) {
    console.error('❌ PDF generation test FAILED:', error)
    return false
  }
}

// Run the test
testPDFGeneration()