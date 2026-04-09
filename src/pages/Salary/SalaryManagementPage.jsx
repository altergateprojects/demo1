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
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">💵</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Salary Management
                  </h1>
                  <p className="mt-1 text-sm text-teal-100">
                    Record and track teacher salary payments with complete audit trail
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-teal-100 text-xs sm:text-sm font-medium">Total Teachers</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{summary.total}</div>
              <div className="mt-1 text-xs text-teal-100">Active staff</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-teal-100 text-xs sm:text-sm font-medium">Paid</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{summary.paid}</div>
              <div className="mt-1 text-xs text-teal-100">{formatINR(summary.paidAmount)}</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-teal-100 text-xs sm:text-sm font-medium">Pending</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{summary.pending}</div>
              <div className="mt-1 text-xs text-teal-100">{formatINR(summary.pendingAmount)}</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-teal-100 text-xs sm:text-sm font-medium">Partial</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{summary.partial}</div>
              <div className="mt-1 text-xs text-teal-100">Needs completion</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-teal-100 text-xs sm:text-sm font-medium">Overdue</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{summary.overdue}</div>
              <div className="mt-1 text-xs text-teal-100">Action required</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Filters</h3>
          <button
            onClick={() => {
              setSelectedMonth(new Date().toISOString().slice(0, 7))
              setFilterStatus('all')
              setSearchQuery('')
            }}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Clear All
          </button>
        </div>
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or subject..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Teachers Table */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="overflow-x-auto">
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400">Loading payment data...</p>
              </div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💵</div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                {searchQuery ? 'No matching teachers' : 'No teachers found'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery ? 'Try adjusting your search or filters' : 'No teachers found for the selected criteria.'}
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
                  <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/teachers/${teacher.id}`}
                        className="text-sm font-medium text-teal-600 hover:text-teal-900 dark:text-teal-400"
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
                          className="bg-teal-600 hover:bg-teal-700"
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
