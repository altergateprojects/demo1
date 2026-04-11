import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import RoleGate from '../../components/shared/RoleGate'
import { useStudents, useStudentsStats } from '../../hooks/useStudents'
import { useStandards, useCurrentAcademicYear, useAcademicYears } from '../../hooks/useCommon'
import { formatINR } from '../../lib/formatters'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import DeleteStudentModal from '../../components/shared/DeleteStudentModal'

const StudentsListPage = () => {
  const { currentAcademicYearId } = useUIStore()
  
  // State for delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
  
  // Filters state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    search: '',
    academicYearId: '',
    standardId: '',
    status: '',
    gender: '',
    feeStatus: '',
    pocketMoneyStatus: ''
  })

  // Get current academic year if not set in UI store
  const { data: currentYear } = useCurrentAcademicYear()
  const academicYearId = filters.academicYearId || currentAcademicYearId || currentYear?.id

  // Fetch data
  const { data: studentsData, isLoading, error } = useStudents({
    ...filters,
    academicYearId
  })
  const { data: standards } = useStandards()
  const { data: stats, isLoading: statsLoading } = useStudentsStats(academicYearId)

  // Memoized stats calculations
  const dashboardStats = useMemo(() => {
    if (!stats) return null
    
    return {
      totalStudents: stats.total || 0,
      activeStudents: stats.active || 0,
      totalPending: stats.totalPending || 0,
      previousYearsPending: stats.previousYearsPending || 0,
      currentYearPending: stats.currentYearPending || 0,
      totalPocketMoney: stats.totalPocketMoney || 0,
      negativePocketMoney: stats.negativePocketMoney || 0,
      maleStudents: stats.male || 0,
      femaleStudents: stats.female || 0
    }
  }, [stats])

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

  const handleDeleteStudent = (student) => {
    setStudentToDelete(student)
    setDeleteModalOpen(true)
  }

  const handleDeleteSuccess = () => {
    setStudentToDelete(null)
    setDeleteModalOpen(false)
    // Refresh the students list
    window.location.reload()
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

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-6 sm:p-8 shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl">👨‍🎓</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Students</h1>
                <p className="mt-1 text-sm text-indigo-100">Loading students...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-6 sm:p-8 shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl">👨‍🎓</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Students</h1>
                <p className="mt-1 text-sm text-indigo-100">Error loading students</p>
              </div>
            </div>
          </div>
        </div>
        <Card className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  const { data: students = [], totalCount = 0, totalPages = 0, currentPage = 1 } = studentsData || {}

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">👨‍🎓</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Students Management
                  </h1>
                  <p className="mt-1 text-sm text-indigo-100">
                    Manage student records and academic information
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <RoleGate allow={['admin', 'finance']}>
                <Link 
                  to="/students/dues" 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  📋 Student Dues
                </Link>
              </RoleGate>
              <RoleGate allow={['admin', 'finance', 'staff']}>
                <Link 
                  to="/students/add" 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
                >
                  + Add Student
                </Link>
              </RoleGate>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-indigo-100 text-xs sm:text-sm font-medium">Total Students</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                {statsLoading ? '...' : dashboardStats?.totalStudents || totalCount}
              </div>
              <div className="mt-1 text-xs text-indigo-100">
                {statsLoading ? 'Loading...' : `${dashboardStats?.activeStudents || 0} active`}
              </div>
            </div>
            
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-indigo-100 text-xs sm:text-sm font-medium">Total Pending Fees</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                {statsLoading ? '...' : formatINR(dashboardStats?.totalPending || 0)}
              </div>
              <div className="mt-1 text-xs text-indigo-100">
                {statsLoading ? 'Loading...' : `${formatINR(dashboardStats?.previousYearsPending || 0)} from prev years`}
              </div>
            </div>
            
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-indigo-100 text-xs sm:text-sm font-medium">Pocket Money</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                {statsLoading ? '...' : formatINR(dashboardStats?.totalPocketMoney || 0)}
              </div>
              <div className="mt-1 text-xs text-indigo-100">
                {statsLoading ? 'Loading...' : `${dashboardStats?.negativePocketMoney || 0} students in debt`}
              </div>
            </div>
            
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-indigo-100 text-xs sm:text-sm font-medium">Gender Distribution</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                {statsLoading ? '...' : `${dashboardStats?.maleStudents || 0}M / ${dashboardStats?.femaleStudents || 0}F`}
              </div>
              <div className="mt-1 text-xs text-indigo-100">
                {statsLoading ? 'Loading...' : `${currentYear?.year_label || 'Current'} session`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search students by name or roll number..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
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

      {/* Filters */}
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Filters</h3>
          <button
            onClick={() => {
              setFilters({
                page: 1,
                limit: 25,
                search: '',
                academicYearId: '',
                standardId: '',
                status: '',
                gender: '',
                feeStatus: '',
                pocketMoneyStatus: ''
              })
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Select
            value={filters.standardId}
            onChange={(e) => handleFilterChange('standardId', e.target.value)}
            options={[
              { value: '', label: 'All Standards' },
              ...(standards || []).map(standard => ({
                value: standard.id,
                label: standard.name
              }))
            ]}
            className="rounded-lg"
          />

          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'Active Students (Default)' },
              { value: 'active', label: 'Active Only' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'withdrawn', label: 'Withdrawn' },
              { value: 'alumni', label: 'Alumni' },
              { value: 'all', label: 'All Students' }
            ]}
            className="rounded-lg"
          />

          <Select
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            options={[
              { value: '', label: 'All Genders' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]}
            className="rounded-lg"
          />

          <Select
            value={filters.feeStatus}
            onChange={(e) => handleFilterChange('feeStatus', e.target.value)}
            options={[
              { value: '', label: 'All Fee Status' },
              { value: 'pending', label: 'Pending Fees' },
              { value: 'paid', label: 'Fully Paid' },
              { value: 'overpaid', label: 'Overpaid' }
            ]}
            className="rounded-lg"
          />
        </div>
      </Card>

      {/* Students List */}
      {students.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description={filters.search ? "No students match your search criteria." : "No students have been added yet."}
          action={
            <RoleGate allow={['admin', 'finance', 'staff']}>
              <Link to="/students/add" className="btn-primary">
                Add First Student
              </Link>
            </RoleGate>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {students.map((student) => (
              <Card 
                key={student.id}
                className="group p-5 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-white">
                          {student.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {student.full_name}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(student.status)}>
                          {student.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <span>Roll: {student.roll_number}</span>
                        <span>Standard: {student.standards?.name || '—'}</span>
                        <span>Gender: {student.gender}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <RoleGate allow={['admin', 'finance']}>
                    <div className="flex items-start gap-6 flex-shrink-0 min-w-0">
                      {/* Fee Status */}
                      <div className="w-32 flex-shrink-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 font-medium">Fee Status</div>
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Paid: {formatINR((student.annual_fee_paise || 0) - (student.current_year_pending_paise || 0))}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              Pending: {formatINR(student.current_year_pending_paise || 0)}
                            </span>
                          </div>
                          {student.previous_years_pending_paise > 0 && (
                            <div className="text-xs">
                              <span className="text-orange-600 dark:text-orange-400 font-medium">
                                Previous: {formatINR(student.previous_years_pending_paise)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pocket Money */}
                      <div className="w-24 flex-shrink-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 font-medium">Pocket Money</div>
                        <div className={`text-sm font-medium ${
                          (student.pocket_money_paise || 0) < 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {formatINR(student.pocket_money_paise || 0)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="w-28 flex-shrink-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 font-medium">Actions</div>
                        <div className="flex flex-col gap-1">
                          <Link
                            to={`/students/${student.id}`}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Details
                          </Link>
                          <RoleGate allow={['admin']}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteStudent(student)
                              }}
                              className="text-xs font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:underline text-left"
                            >
                              Delete Student
                            </button>
                          </RoleGate>
                        </div>
                      </div>
                    </div>
                  </RoleGate>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {((currentPage - 1) * filters.limit) + 1} to {Math.min(currentPage * filters.limit, totalCount)} of {totalCount} students
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                  >
                    ← Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Delete Student Modal */}
      <DeleteStudentModal
        key={studentToDelete?.id || 'delete-modal'} // Force re-render when student changes
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        student={studentToDelete}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  )
}

export default StudentsListPage