import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeachers, useDeleteTeacher } from '../../hooks/useTeachers'
import RoleGate from '../../components/shared/RoleGate'
import { formatPhone, formatRelativeTime } from '../../lib/formatters'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'

const TeachersListPage = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    search: '',
    status: 'all',
    sortBy: 'full_name',
    sortOrder: 'asc'
  })

  const { data, isLoading, error } = useTeachers(filters)
  const deleteTeacherMutation = useDeleteTeacher()

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }))
  }

  const handleDeleteTeacher = async (teacher) => {
    if (window.confirm(`Are you sure you want to delete ${teacher.full_name}? This action cannot be undone.`)) {
      await deleteTeacherMutation.mutateAsync(teacher.id)
    }
  }

  if (isLoading) return <LoadingScreen />

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          Error Loading Teachers
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {error.message || 'Failed to load teachers data'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  const { teachers = [], totalCount = 0, totalPages = 0, currentPage = 1 } = data || {}

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">👨‍🏫</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Teachers
                  </h1>
                  <p className="mt-1 text-sm text-emerald-100">
                    Manage your school's teaching staff
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <RoleGate allow={['admin']}>
                <Link 
                  to="/teachers/add" 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-6 py-2 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
                >
                  + Add Teacher
                </Link>
              </RoleGate>
            </div>
          </div>

          {/* Stats Cards */}
          {data && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-emerald-100 text-xs sm:text-sm font-medium">Total Teachers</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{totalCount || 0}</div>
                <div className="mt-1 text-xs text-emerald-100">Teaching staff</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-emerald-100 text-xs sm:text-sm font-medium">Current Page</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{currentPage} of {totalPages || 1}</div>
                <div className="mt-1 text-xs text-emerald-100">Showing {teachers.length} teachers</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20 sm:col-span-2 lg:col-span-1">
                <div className="text-emerald-100 text-xs sm:text-sm font-medium">Active Teachers</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {teachers.filter(t => t.status === 'active').length}
                </div>
                <div className="mt-1 text-xs text-emerald-100">Currently teaching</div>
              </div>
            </div>
          )}
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
              placeholder="Search teachers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
            onClick={() => setFilters({
              page: 1,
              limit: 25,
              search: '',
              status: 'all',
              sortBy: 'full_name',
              sortOrder: 'asc'
            })}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            className="rounded-lg"
          />

          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              handleFilterChange('sortBy', sortBy)
              handleFilterChange('sortOrder', sortOrder)
            }}
            options={[
              { value: 'full_name-asc', label: 'Name (A-Z)' },
              { value: 'full_name-desc', label: 'Name (Z-A)' },
              { value: 'created_at-desc', label: 'Newest First' },
              { value: 'created_at-asc', label: 'Oldest First' }
            ]}
            className="rounded-lg"
          />
        </div>
      </Card>

      {/* Teachers List */}
      {teachers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {filters.search ? "No matching teachers" : "No Teachers Found"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {filters.search ? "No teachers match your search criteria." : "No teachers have been added yet."}
            </p>
            <RoleGate allow={['admin']}>
              <Link to="/teachers/add" className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
                + Add First Teacher
              </Link>
            </RoleGate>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <Card 
                key={teacher.id}
                className="group p-5 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Teacher Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-white">
                          {teacher.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {teacher.full_name}
                        </h3>
                        <Badge variant={teacher.status === 'active' ? 'success' : 'secondary'}>
                          {teacher.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        {teacher.subject && (
                          <>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">📚</span>
                              {teacher.subject}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">📅</span>
                          {formatRelativeTime(teacher.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                    <div className="text-center sm:text-left">
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Email</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {teacher.email || '—'}
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Phone</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatPhone(teacher.phone) || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 lg:pl-4">
                    <Link
                      to={`/teachers/${teacher.id}`}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      View
                    </Link>
                    <RoleGate allow={['admin']}>
                      <Link
                        to={`/teachers/${teacher.id}/edit`}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        disabled={deleteTeacherMutation.isLoading}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </RoleGate>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {(currentPage - 1) * filters.limit + 1} to {Math.min(currentPage * filters.limit, totalCount)} of {totalCount} teachers
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    disabled={currentPage === 1}
                    onClick={() => handleFilterChange('page', currentPage - 1)}
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
                          onClick={() => handleFilterChange('page', page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => handleFilterChange('page', currentPage + 1)}
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
    </div>
  )
}

export default TeachersListPage