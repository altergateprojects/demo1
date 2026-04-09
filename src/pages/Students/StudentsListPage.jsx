import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import RoleGate from '../../components/shared/RoleGate'
import { useStudents } from '../../hooks/useStudents'
import { useStandards, useCurrentAcademicYear, useAcademicYears } from '../../hooks/useCommon'
import { formatINR, formatDate } from '../../lib/formatters'
import { STUDENT_STATUS } from '../../lib/constants'
import Skeleton from '../../components/ui/Skeleton'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'

const StudentsListPage = () => {
  const { hasRole } = useAuthStore()
  const { currentAcademicYearId } = useUIStore()
  
  // Filters state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    search: '',
    academicYearId: '', // Add academic year filter
    standardId: '',
    status: '',
    gender: '',
    feeStatus: '',
    pocketMoneyStatus: ''
  })

  const [isExporting, setIsExporting] = useState(false)

  // Get current academic year if not set in UI store
  const { data: currentYear } = useCurrentAcademicYear()
  const { data: academicYears } = useAcademicYears()
  const academicYearId = filters.academicYearId || currentAcademicYearId || currentYear?.id

  // Fetch data
  const { data: studentsData, isLoading, error } = useStudents({
    ...filters,
    academicYearId
  })
  const { data: standards } = useStandards()

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'suspended': return 'danger'
      case 'withdrawn': return 'warning'
      case 'alumni': return 'info'
      default: return 'default'
    }
  }

  // Export functions
  const exportToCSV = () => {
    if (!studentsData?.data?.length) {
      alert('No students found to export')
      return
    }

    setIsExporting(true)
    try {
      const csvContent = generateCSV(studentsData.data)
      downloadFile(csvContent, 'students-export.csv', 'text/csv')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = () => {
    if (!studentsData?.data?.length) {
      alert('No students found to export')
      return
    }

    setIsExporting(true)
    try {
      const htmlContent = generatePDF(studentsData.data)
      const printWindow = window.open('', '_blank')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (students) => {
    const headers = [
      'Name', 'Roll Number', 'Standard', 'Gender', 'Status',
      'Annual Fee (₹)', 'Fee Paid (₹)', 'Pending Fee (₹)',
      'Pocket Money (₹)', 'Guardian Name', 'Phone Number',
      'Admission Date', 'Date of Birth'
    ]

    const rows = students.map(student => [
      student.full_name,
      student.roll_number,
      student.standards?.name || '',
      student.gender,
      student.status,
      (student.annual_fee_paise / 100).toFixed(2),
      (student.fee_paid_paise / 100).toFixed(2),
      (Math.max(0, student.annual_fee_paise - student.fee_paid_paise) / 100).toFixed(2),
      (student.pocket_money_paise / 100).toFixed(2),
      student.guardian_name || '',
      student.phone_number || '',
      student.admission_date || '',
      student.date_of_birth || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\\n')

    return csvContent
  }

  const generatePDF = (students) => {
    const activeFilters = getActiveFiltersText()
    const currentDate = new Date().toLocaleDateString()
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>Students Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .header { text-align: center; margin-bottom: 20px; }
    .summary { margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Students Report</h1>
    <p>Generated on: ${currentDate}</p>
  </div>
  <div class="summary">
    <p><strong>Total Students:</strong> ${students.length}</p>
    <p><strong>Filters Applied:</strong> ${activeFilters}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Name</th><th>Roll No.</th><th>Standard</th><th>Gender</th><th>Status</th>
        <th>Annual Fee</th><th>Fee Paid</th><th>Pending Fee</th><th>Pocket Money</th>
      </tr>
    </thead>
    <tbody>
      ${students.map(student => 
        `<tr>
          <td>${student.full_name}</td>
          <td>${student.roll_number}</td>
          <td>${student.standards?.name || ''}</td>
          <td>${student.gender}</td>
          <td>${student.status}</td>
          <td>₹${(student.annual_fee_paise / 100).toFixed(2)}</td>
          <td>₹${(student.fee_paid_paise / 100).toFixed(2)}</td>
          <td>₹${(Math.max(0, student.annual_fee_paise - student.fee_paid_paise) / 100).toFixed(2)}</td>
          <td>₹${(student.pocket_money_paise / 100).toFixed(2)}</td>
        </tr>`
      ).join('')}
    </tbody>
  </table>
</body>
</html>`
  }

  const getActiveFiltersText = () => {
    const activeFilters = []
    if (filters.search) activeFilters.push(`Search: "${filters.search}"`)
    if (filters.standardId) {
      const standard = standards?.find(s => s.id === filters.standardId)
      activeFilters.push(`Standard: ${standard?.name}`)
    }
    if (filters.status) activeFilters.push(`Status: ${filters.status}`)
    if (filters.gender) activeFilters.push(`Gender: ${filters.gender}`)
    if (filters.feeStatus) activeFilters.push(`Fee Status: ${filters.feeStatus}`)
    if (filters.pocketMoneyStatus) activeFilters.push(`Pocket Money: ${filters.pocketMoneyStatus}`)
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'None'
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage student records and fee information
          </p>
        </div>
        
        <div className="flex space-x-3">
          <RoleGate allow={['admin', 'finance']}>
            <Link to="/students/dues" className="btn-secondary">
              📋 Student Dues
            </Link>
          </RoleGate>
          
          <RoleGate allow={['admin', 'finance']}>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportToCSV}
                loading={isExporting}
                disabled={isExporting}
              >
                Export CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportToPDF}
                loading={isExporting}
                disabled={isExporting}
              >
                Export PDF
              </Button>
            </div>
          </RoleGate>

          <RoleGate allow={['admin', 'finance', 'staff']}>
            <Link to="/students/add" className="btn-primary">
              Add Student
            </Link>
          </RoleGate>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or roll number..."
              className="input-field"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Academic Year
            </label>
            <select
              className="input-field"
              value={filters.academicYearId}
              onChange={(e) => handleFilterChange('academicYearId', e.target.value)}
            >
              <option value="">Current Year</option>
              {academicYears?.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label} {year.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Standard
            </label>
            <select
              className="input-field"
              value={filters.standardId}
              onChange={(e) => handleFilterChange('standardId', e.target.value)}
            >
              <option value="">All Standards</option>
              {standards?.map((standard) => (
                <option key={standard.id} value={standard.id}>
                  {standard.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fee Status
            </label>
            <select
              className="input-field"
              value={filters.feeStatus}
              onChange={(e) => handleFilterChange('feeStatus', e.target.value)}
            >
              <option value="">All Fee Status</option>
              <option value="pending">Pending Fees</option>
              <option value="paid">Fully Paid</option>
              <option value="overpaid">Overpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pocket Money
            </label>
            <select
              className="input-field"
              value={filters.pocketMoneyStatus}
              onChange={(e) => handleFilterChange('pocketMoneyStatus', e.target.value)}
            >
              <option value="">All Balances</option>
              <option value="negative">Negative</option>
              <option value="zero">Zero</option>
              <option value="positive">Positive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                page: 1,
                limit: 25,
                search: '',
                academicYearId: '',
                standardId: '',
                status: '',
                gender: '',
                feeStatus: '',
                pocketMoneyStatus: ''
              })}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <Skeleton.Table rows={10} columns={8} />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">Error loading students: {error.message}</p>
        </div>
      ) : studentsData?.data?.length > 0 ? (
        <div className="card overflow-hidden">
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
                    Status
                  </th>
                  <RoleGate allow={['admin', 'finance']}>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Fee Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Pocket Money
                    </th>
                  </RoleGate>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {studentsData.data.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Roll: {student.roll_number} • {student.gender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {student.standards?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(student.status)}>
                        {student.status}
                      </Badge>
                    </td>
                    <RoleGate allow={['admin', 'finance']}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-slate-900 dark:text-slate-100">
                          {formatINR(Math.max(0, student.annual_fee_paise - student.fee_paid_paise))} pending
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {formatINR(student.fee_paid_paise)} / {formatINR(student.annual_fee_paise)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          student.pocket_money_paise < 0 
                            ? 'text-red-600 dark:text-red-400'
                            : student.pocket_money_paise > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {formatINR(student.pocket_money_paise)}
                        </span>
                      </td>
                    </RoleGate>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/students/${student.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          View
                        </Link>
                        <RoleGate allow={['admin', 'finance', 'staff']}>
                          <Link
                            to={`/students/${student.id}/edit`}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          >
                            Edit
                          </Link>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {studentsData.totalPages > 1 && (
            <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= studentsData.totalPages}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Showing{' '}
                    <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, studentsData.count)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{studentsData.count}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                      className="btn-secondary rounded-r-none"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= studentsData.totalPages}
                      className="btn-secondary rounded-l-none"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No students found"
          description="No students match your current filters. Try adjusting your search criteria."
          action={
            <Link to="/students/add" className="btn-primary">
              Add First Student
            </Link>
          }
        />
      )}
    </div>
  )
}

export default StudentsListPage