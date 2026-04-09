import { useState } from 'react'
import { useCurrentAcademicYear } from '../../hooks/useCommon'
import { useFinancialSummary, useFeeCollectionReport, useExpenseReport, useStudentFeeStatus } from '../../hooks/useReports'
import { formatINR, formatDate } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

const ReportsPage = () => {
  const { data: currentYear } = useCurrentAcademicYear()
  const [activeReport, setActiveReport] = useState('financial-summary')
  const [dateRange, setDateRange] = useState({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  })

  const { data: financialSummary, isLoading: financialLoading } = useFinancialSummary(
    currentYear?.id,
    dateRange.dateFrom,
    dateRange.dateTo
  )

  const { data: feeCollectionReport, isLoading: feeLoading } = useFeeCollectionReport(
    currentYear?.id,
    dateRange.dateFrom,
    dateRange.dateTo
  )

  const { data: expenseReport, isLoading: expenseLoading } = useExpenseReport(
    currentYear?.id,
    dateRange.dateFrom,
    dateRange.dateTo
  )

  const { data: studentFeeStatus, isLoading: statusLoading } = useStudentFeeStatus(currentYear?.id)

  if (!currentYear) return <LoadingScreen />

  const reports = [
    { id: 'financial-summary', label: 'Financial Summary', icon: '📊' },
    { id: 'fee-collection', label: 'Fee Collection', icon: '💰' },
    { id: 'expenses', label: 'Expense Report', icon: '📋' },
    { id: 'student-status', label: 'Student Fee Status', icon: '👥' }
  ]

  const handleDateChange = (key, value) => {
    setDateRange(prev => ({ ...prev, [key]: value }))
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Title
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Financial Report', pageWidth / 2, 15, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Academic Year: ${currentYear.year_label}`, pageWidth / 2, 22, { align: 'center' })
      doc.text(`Period: ${formatDate(dateRange.dateFrom)} to ${formatDate(dateRange.dateTo)}`, pageWidth / 2, 28, { align: 'center' })
      
      let yPos = 35

      // Financial Summary
      if (activeReport === 'financial-summary' && financialSummary) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Financial Summary', 14, yPos)
        yPos += 10

        const summaryData = [
          ['Total Income', formatINR(financialSummary.total_income || 0)],
          ['Total Expenses', formatINR(financialSummary.total_expenses || 0)],
          ['Net Balance', formatINR(financialSummary.net_balance || 0)],
          ['Collection Rate', `${financialSummary.collection_rate || 0}%`]
        ]

        doc.autoTable({
          startY: yPos,
          head: [['Metric', 'Value']],
          body: summaryData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] }
        })
      }

      // Fee Collection Report
      if (activeReport === 'fee-collection' && feeCollectionReport?.length) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Fee Collection Report', 14, yPos)
        yPos += 10

        const feeData = feeCollectionReport.map(row => [
          row.standard_name,
          row.student_count,
          formatINR(row.expected_amount),
          formatINR(row.collected_amount),
          formatINR(row.pending_amount),
          `${row.collection_percentage}%`
        ])

        doc.autoTable({
          startY: yPos,
          head: [['Standard', 'Students', 'Expected', 'Collected', 'Pending', 'Rate']],
          body: feeData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] }
        })
      }

      // Expense Report
      if (activeReport === 'expenses' && expenseReport?.length) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Expense Report', 14, yPos)
        yPos += 10

        const expenseData = expenseReport.map(row => [
          row.category_name,
          row.expense_count,
          formatINR(row.total_amount),
          formatINR(row.average_amount),
          `${row.percentage}%`
        ])

        doc.autoTable({
          startY: yPos,
          head: [['Category', 'Count', 'Total', 'Average', '% of Total']],
          body: expenseData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] }
        })
      }

      // Student Fee Status
      if (activeReport === 'student-status' && studentFeeStatus?.length) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Student Fee Status', 14, yPos)
        yPos += 10

        const studentData = studentFeeStatus.map(student => [
          student.full_name,
          student.roll_number,
          student.standard_name,
          formatINR(student.annual_fee),
          formatINR(student.fee_paid),
          formatINR(student.balance),
          student.balance <= 0 ? 'Paid' : student.balance < student.annual_fee * 0.5 ? 'Partial' : 'Pending'
        ])

        doc.autoTable({
          startY: yPos,
          head: [['Name', 'Roll No', 'Standard', 'Annual Fee', 'Paid', 'Balance', 'Status']],
          body: studentData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] },
          styles: { fontSize: 8 }
        })
      }

      // Save PDF
      const fileName = `${activeReport}-${dateRange.dateFrom}-to-${dateRange.dateTo}.pdf`
      doc.save(fileName)
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    }
  }

  const exportToExcel = () => {
    try {
      let data = []
      let sheetName = 'Report'

      // Prepare data based on active report
      if (activeReport === 'financial-summary' && financialSummary) {
        sheetName = 'Financial Summary'
        data = [
          ['Financial Summary'],
          ['Academic Year', currentYear.year_label],
          ['Period', `${formatDate(dateRange.dateFrom)} to ${formatDate(dateRange.dateTo)}`],
          [],
          ['Metric', 'Value'],
          ['Total Income', formatINR(financialSummary.total_income || 0)],
          ['Total Expenses', formatINR(financialSummary.total_expenses || 0)],
          ['Net Balance', formatINR(financialSummary.net_balance || 0)],
          ['Collection Rate', `${financialSummary.collection_rate || 0}%`]
        ]
      } else if (activeReport === 'fee-collection' && feeCollectionReport?.length) {
        sheetName = 'Fee Collection'
        data = [
          ['Fee Collection Report'],
          ['Academic Year', currentYear.year_label],
          ['Period', `${formatDate(dateRange.dateFrom)} to ${formatDate(dateRange.dateTo)}`],
          [],
          ['Standard', 'Students', 'Expected', 'Collected', 'Pending', 'Collection %'],
          ...feeCollectionReport.map(row => [
            row.standard_name,
            row.student_count,
            row.expected_amount / 100,
            row.collected_amount / 100,
            row.pending_amount / 100,
            row.collection_percentage
          ])
        ]
      } else if (activeReport === 'expenses' && expenseReport?.length) {
        sheetName = 'Expenses'
        data = [
          ['Expense Report'],
          ['Academic Year', currentYear.year_label],
          ['Period', `${formatDate(dateRange.dateFrom)} to ${formatDate(dateRange.dateTo)}`],
          [],
          ['Category', 'Count', 'Total Amount', 'Average', '% of Total'],
          ...expenseReport.map(row => [
            row.category_name,
            row.expense_count,
            row.total_amount / 100,
            row.average_amount / 100,
            row.percentage
          ])
        ]
      } else if (activeReport === 'student-status' && studentFeeStatus?.length) {
        sheetName = 'Student Fee Status'
        data = [
          ['Student Fee Status Report'],
          ['Academic Year', currentYear.year_label],
          [],
          ['Name', 'Roll Number', 'Standard', 'Annual Fee', 'Paid', 'Balance', 'Status'],
          ...studentFeeStatus.map(student => [
            student.full_name,
            student.roll_number,
            student.standard_name,
            student.annual_fee / 100,
            student.fee_paid / 100,
            student.balance / 100,
            student.balance <= 0 ? 'Paid' : student.balance < student.annual_fee * 0.5 ? 'Partial' : 'Pending'
          ])
        ]
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(data)

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName)

      // Save file
      const fileName = `${activeReport}-${dateRange.dateFrom}-to-${dateRange.dateTo}.xlsx`
      XLSX.writeFile(wb, fileName)
      toast.success('Excel file exported successfully!')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Failed to export Excel file')
    }
  }

  const renderFinancialSummary = () => (
    <div className="space-y-6">
      {financialLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading financial summary...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Income</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(financialSummary?.total_income || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(financialSummary?.total_expenses || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  (financialSummary?.net_balance || 0) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatINR(financialSummary?.net_balance || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Collection Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {financialSummary?.collection_rate || 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )

  const renderFeeCollectionReport = () => (
    <div className="space-y-6">
      {feeLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading fee collection report...</p>
          </div>
        </div>
      ) : !feeCollectionReport?.length ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No Fee Collection Data
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No fee collection data found for the selected date range.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Fee Collection Details
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Standard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Collection %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {feeCollectionReport?.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {row.standard_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {row.student_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(row.expected_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(row.collected_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(row.pending_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={row.collection_percentage >= 80 ? 'success' : row.collection_percentage >= 50 ? 'warning' : 'danger'}>
                        {row.collection_percentage}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )

  const renderExpenseReport = () => (
    <div className="space-y-6">
      {expenseLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading expense report...</p>
          </div>
        </div>
      ) : !expenseReport?.length ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No Expense Data
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No expenses found for the selected date range.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Expense Breakdown by Category
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Average
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {expenseReport?.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {row.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {row.expense_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(row.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(row.average_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-amber-600 h-2 rounded-full" 
                            style={{ width: `${row.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-600 dark:text-slate-400">{row.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )

  const renderStudentFeeStatus = () => (
    <div className="space-y-6">
      {statusLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading student fee status...</p>
          </div>
        </div>
      ) : !studentFeeStatus?.length ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No Student Data
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No active students found for the current academic year.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Student Fee Status Overview
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Standard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Annual Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {studentFeeStatus?.map((student, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {student.full_name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {student.roll_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {student.standard_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(student.annual_fee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(student.fee_paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatINR(student.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        student.balance <= 0 ? 'success' : 
                        student.balance < student.annual_fee * 0.5 ? 'warning' : 'danger'
                      }>
                        {student.balance <= 0 ? 'Paid' : 
                         student.balance < student.annual_fee * 0.5 ? 'Partial' : 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Reports & Analytics
                  </h1>
                  <p className="mt-1 text-sm text-amber-100">
                    Financial reports and analytics for {currentYear.year_label}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={exportToPDF}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                📄 Export PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                📊 Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Date Range</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              From:
            </label>
            <Input
              type="date"
              value={dateRange.dateFrom}
              onChange={(e) => handleDateChange('dateFrom', e.target.value)}
              className="rounded-lg flex-1"
            />
          </div>
          <span className="text-slate-500 hidden sm:block">to</span>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              To:
            </label>
            <Input
              type="date"
              value={dateRange.dateTo}
              onChange={(e) => handleDateChange('dateTo', e.target.value)}
              className="rounded-lg flex-1"
            />
          </div>
        </div>
      </Card>

      {/* Modern Pill-style Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
              activeReport === report.id
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>{report.icon}</span>
            <span>{report.label}</span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeReport === 'financial-summary' && renderFinancialSummary()}
      {activeReport === 'fee-collection' && renderFeeCollectionReport()}
      {activeReport === 'expenses' && renderExpenseReport()}
      {activeReport === 'student-status' && renderStudentFeeStatus()}
    </div>
  )
}

export default ReportsPage