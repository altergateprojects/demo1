import React, { useState } from 'react'
import { useCurrentAcademicYear } from '../../hooks/useCommon'
import { useFinancialSummary, useFeeCollectionReport, useExpenseReport, useStudentFeeStatus } from '../../hooks/useReports'
import { formatINR, formatDate } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'

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

  const renderFinancialSummary = () => (
    <div className="space-y-6">
      {financialLoading ? (
        <LoadingScreen />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">💰</span>
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

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400">📋</span>
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

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">📈</span>
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

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400">🎯</span>
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
        <LoadingScreen />
      ) : !feeCollectionReport?.length ? (
        <Card className="p-8 text-center">
          <div className="text-slate-400 mb-4">📊</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Fee Collection Data
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No fee collection data found for the selected date range.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
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
                  <tr key={index}>
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
        <LoadingScreen />
      ) : !expenseReport?.length ? (
        <Card className="p-8 text-center">
          <div className="text-slate-400 mb-4">📋</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Expense Data
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No expenses found for the selected date range.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
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
                  <tr key={index}>
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
                            className="bg-primary-600 h-2 rounded-full" 
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
        <LoadingScreen />
      ) : !studentFeeStatus?.length ? (
        <Card className="p-8 text-center">
          <div className="text-slate-400 mb-4">👥</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Student Data
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No active students found for the current academic year.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
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
                  <tr key={index}>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Financial reports and analytics for {currentYear.year_label}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            Export PDF
          </Button>
          <Button variant="secondary">
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Date Range:
            </label>
            <Input
              type="date"
              value={dateRange.dateFrom}
              onChange={(e) => handleDateChange('dateFrom', e.target.value)}
              className="w-auto"
            />
            <span className="text-slate-500">to</span>
            <Input
              type="date"
              value={dateRange.dateTo}
              onChange={(e) => handleDateChange('dateTo', e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </Card>

      {/* Report Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeReport === report.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span>{report.icon}</span>
              <span>{report.label}</span>
            </button>
          ))}
        </nav>
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