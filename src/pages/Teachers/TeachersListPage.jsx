import React, { useState } from 'react'
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Teachers
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your school's teaching staff
          </p>
        </div>
        
        <RoleGate allow={['admin']}>
          <Link to="/teachers/add" className="btn-primary">
            Add Teacher
          </Link>
        </RoleGate>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search teachers..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="md:col-span-2"
          />
          
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
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
          />
        </div>
      </div>

      {/* Teachers List */}
      {teachers.length === 0 ? (
        <EmptyState
          title="No Teachers Found"
          description={filters.search ? "No teachers match your search criteria." : "No teachers have been added yet."}
          action={
            <RoleGate allow={['admin']}>
              <Link to="/teachers/add" className="btn-primary">
                Add First Teacher
              </Link>
            </RoleGate>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {teacher.full_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {teacher.full_name}
                          </div>
                          {teacher.subject && (
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {teacher.subject}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {teacher.email || '—'}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {formatPhone(teacher.phone) || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={teacher.status === 'active' ? 'green' : 'gray'}>
                        {teacher.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatRelativeTime(teacher.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/teachers/${teacher.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                        >
                          View
                        </Link>
                        <RoleGate allow={['admin']}>
                          <Link
                            to={`/teachers/${teacher.id}/edit`}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            disabled={deleteTeacherMutation.isLoading}
                          >
                            Delete
                          </button>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => handleFilterChange('page', currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => handleFilterChange('page', currentPage + 1)}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * filters.limit + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * filters.limit, totalCount)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{totalCount}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button
                      variant="secondary"
                      disabled={currentPage === 1}
                      onClick={() => handleFilterChange('page', currentPage - 1)}
                      className="rounded-r-none"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={currentPage === totalPages}
                      onClick={() => handleFilterChange('page', currentPage + 1)}
                      className="rounded-l-none"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeachersListPage