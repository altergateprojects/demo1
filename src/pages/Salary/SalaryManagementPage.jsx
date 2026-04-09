import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTeachers } from '../../hooks/useTeachers'
import { useSalaryPaymentsByMonth } from '../../hooks/useTeacherSalary'
import { formatINR, formatDate } from '../../lib/formatters'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingScreen from '../../components/ui/LoadingScreen'
import SalaryPaymentModal from '../../components/shared/SalaryPaymentModal'
import BonusModal from '../../components/shared/BonusModal'

const SalaryManagementPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [filterStatus, setFilterStatus] = useState('all') // all, pending, paid, overdue
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)

  // Fetch teachers and payments
  const { data: teachersData, isLoading: teachersLoading } = useTeachers({ status: 'active', limit: 1000 })
  const { data: payments, isLoading: paymentsLoading } = useSalaryPaymentsByMonth(selectedMonth)

  // Extract teachers array from the response
  const teachers = teachersData?.teachers || []

  // Calculate payment status for each teacher
  const teachersWithStatus = useMemo(() => {
    if (!teachers || !payments) return []

    const selectedDate = new Date(selectedMonth + '-01')
    const currentDate = new Date()
    
    return teachers.map(teacher => {
      // Find all payments for this teacher in selected month
      const teacherPayments = payments.filter(p => p.teacher_id === teacher.id)
      const totalPaid = teacherPayments.reduce((sum, p) => sum + (p.total_amount_paise || 0), 0)
      const expectedSalary = teacher.current_salary_paise || 0
      
      // Calculate payment due date (based on joining date or 1st of month)
      const joiningDate = new Date(teacher.created_at)
      const paymentDay = joiningDate.getDate()
      const dueDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), paymentDay)
      
      // Determine status
      let status = 'pending'
      let statusColor = 'yellow'
      
      if (totalPaid >= expectedSalary) {
        status = 'paid'
        statusColor = 'green'
      } else if (totalPaid > 0) {
        status = 'partial'
        statusColor = 'orange'
      } else if (currentDate > dueDate) {
        status = 'overdue'
        statusColor = 'red'
      }

      return {
        ...teacher,
        payments: teacherPayments,
        totalPaid,
        dueDate,
        status,
        statusColor,
        amountDue: expectedSalary,
        remainingAmount: expectedSalary - totalPaid
      }
    })
  }, [teachers, payments, selectedMonth])

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    let filtered = teachersWithStatus

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.full_name?.toLowerCase().includes(query) ||
        t.subject?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [teachersWithStatus, filterStatus, searchQuery])

  // Calculate summary
  const summary = useMemo(() => {
    return {
      total: teachersWithStatus.length,
      paid: teachersWithStatus.filter(t => t.status === 'paid').length,
      partial: teachersWithStatus.filter(t => t.status === 'partial').length,
      pending: teachersWithStatus.filter(t => t.status === 'pending').length,
      overdue: teachersWithStatus.filter(t => t.status === 'overdue').length,
      totalAmount: teachersWithStatus.reduce((sum, t) => sum + t.amountDue, 0),
      paidAmount: teachersWithStatus.reduce((sum, t) => sum + t.totalPaid, 0),
      pendingAmount: teachersWithStatus.filter(t => t.status !== 'paid').reduce((sum, t) => sum + t.remainingAmount, 0)
    }
  }, [teachersWithStatus])

  const handlePaySalary = (teacher) => {
    setSelectedTeacher(teacher)
    setShowPaymentModal(true)
  }

  const handleAddBonus = (teacher) => {
    setSelectedTeacher(teacher)
    setShowBonusModal(true)
  }

  if (teachersLoading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Salary Management
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Record and track teacher salary payments with complete audit trail
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Teachers</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{summary.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-900 dark:text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Paid</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{summary.paid}</p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">{formatINR(summary.paidAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-900 dark:text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending</p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">{summary.pending}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{formatINR(summary.pendingAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-900 dark:text-yellow-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Partial</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">{summary.partial}</p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Needs Completion</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-900 dark:text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Overdue</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">{summary.overdue}</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">Action Required</p>
            </div>
            <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-900 dark:text-red-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search Teachers
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or subject..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </Card>

      {/* Teachers Table */}
      <Card>
        <div className="overflow-x-auto">
          {paymentsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Loading payment data...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery ? 'No teachers found matching your search.' : 'No teachers found.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Monthly Salary
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/teachers/${teacher.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-900 dark:text-primary-400"
                      >
                        {teacher.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {teacher.subject || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-slate-100">
                      <div>
                        <div>{formatINR(teacher.amountDue)}</div>
                        {teacher.status === 'partial' && (
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            Paid: {formatINR(teacher.totalPaid)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-400">
                      {formatDate(teacher.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        teacher.statusColor === 'green'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : teacher.statusColor === 'orange'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : teacher.statusColor === 'yellow'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      {teacher.status !== 'paid' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePaySalary(teacher)}
                        >
                          {teacher.status === 'partial' ? 'Pay Remaining' : 'Pay Salary'}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddBonus(teacher)}
                      >
                        Add Bonus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer */}
        {filteredTeachers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
              </p>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Total Amount: {formatINR(summary.totalAmount)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showPaymentModal && selectedTeacher && (
        <SalaryPaymentModal
          isOpen={showPaymentModal}
          teacher={selectedTeacher}
          month={selectedMonth}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedTeacher(null)
          }}
        />
      )}

      {showBonusModal && selectedTeacher && (
        <BonusModal
          isOpen={showBonusModal}
          teacher={selectedTeacher}
          onClose={() => {
            setShowBonusModal(false)
            setSelectedTeacher(null)
          }}
        />
      )}
    </div>
  )
}

export default SalaryManagementPage
