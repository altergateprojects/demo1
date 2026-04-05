import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTeacher } from '../../hooks/useTeachers'
import { useTeacherSalaryHistory, useTeacherBonuses } from '../../hooks/useTeacherSalary'
import RoleGate from '../../components/shared/RoleGate'
import SalaryUpdateModal from '../../components/shared/SalaryUpdateModal'
import BonusModal from '../../components/shared/BonusModal'
import { formatINR, formatPhone, formatRelativeTime, formatDate } from '../../lib/formatters'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

const TeacherDetailPage = () => {
  const { id } = useParams()
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)
  
  const { data: teacher, isLoading, error } = useTeacher(id)
  const { data: salaryHistory, isLoading: salaryLoading } = useTeacherSalaryHistory(id)
  const { data: bonuses, isLoading: bonusesLoading } = useTeacherBonuses(id)

  if (isLoading) return <LoadingScreen />
  
  if (error || !teacher) {
    return (
      <EmptyState
        title="Teacher Not Found"
        description="The teacher you're looking for doesn't exist or has been deleted."
        action={
          <Link to="/teachers" className="btn-primary">
            Back to Teachers
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
            <Link to="/teachers" className="hover:text-slate-900 dark:hover:text-slate-100">
              Teachers
            </Link>
            <span>/</span>
            <span>{teacher.full_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {teacher.full_name}
          </h1>
          <div className="flex items-center space-x-3 mt-2">
            <Badge variant={teacher.status === 'active' ? 'green' : 'gray'}>
              {teacher.status}
            </Badge>
            {teacher.subject && (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {teacher.subject}
              </span>
            )}
          </div>
        </div>
        
        <RoleGate allow={['admin', 'finance']}>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowSalaryModal(true)}
              className="btn-secondary"
            >
              Update Salary
            </button>
            <button 
              onClick={() => setShowBonusModal(true)}
              className="btn-secondary"
            >
              Add Bonus
            </button>
            <Link to={`/teachers/${id}/edit`} className="btn-primary">
              Edit Teacher
            </Link>
          </div>
        </RoleGate>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teacher Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{teacher.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={teacher.status === 'active' ? 'green' : 'gray'}>
                    {teacher.status}
                  </Badge>
                </div>
              </div>
              {teacher.subject && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subject/Department
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{teacher.subject}</p>
                </div>
              )}
              {teacher.qualification && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Qualification
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{teacher.qualification}</p>
                </div>
              )}
              {teacher.experience_years !== null && teacher.experience_years !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Experience
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {teacher.experience_years} {teacher.experience_years === 1 ? 'year' : 'years'}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Joined
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {formatRelativeTime(teacher.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {teacher.email ? (
                    <a 
                      href={`mailto:${teacher.email}`}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                    >
                      {teacher.email}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {teacher.phone ? (
                    <a 
                      href={`tel:${teacher.phone}`}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                    >
                      {formatPhone(teacher.phone)}
                    </a>
                  ) : '—'}
                </p>
              </div>
              {teacher.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Address
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{teacher.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {(teacher.emergency_contact || teacher.emergency_phone) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Emergency Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacher.emergency_contact && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Contact Name
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{teacher.emergency_contact}</p>
                  </div>
                )}
                {teacher.emergency_phone && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Phone Number
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                      <a 
                        href={`tel:${teacher.emergency_phone}`}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                      >
                        {formatPhone(teacher.emergency_phone)}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {teacher.notes && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Notes
              </h2>
              <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                {teacher.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Salary Summary - Finance/Admin Only */}
          <RoleGate allow={['admin', 'finance']}>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Salary Information
              </h3>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(teacher.current_salary_paise || 0)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Monthly Salary
                </p>
                {teacher.salary_effective_date && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Effective: {formatDate(teacher.salary_effective_date)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowSalaryModal(true)}
                  className="w-full btn-primary text-sm"
                >
                  Update Salary
                </button>
                <button 
                  onClick={() => setShowBonusModal(true)}
                  className="w-full btn-secondary text-sm"
                >
                  Add Bonus
                </button>
              </div>
            </div>
          </RoleGate>
          {/* Teacher Photo */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Teacher Photo
            </h3>
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-slate-500 dark:text-slate-400">
                  {teacher.full_name.charAt(0)}
                </span>
              </div>
            </div>
            <RoleGate allow={['admin']}>
              <button className="w-full mt-4 btn-secondary text-sm">
                Upload Photo
              </button>
            </RoleGate>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Quick Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
                <Badge variant={teacher.status === 'active' ? 'green' : 'gray'} size="sm">
                  {teacher.status}
                </Badge>
              </div>
              {teacher.experience_years !== null && teacher.experience_years !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Experience:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {teacher.experience_years} {teacher.experience_years === 1 ? 'year' : 'years'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Joined:</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {new Date(teacher.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Last Updated:</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatRelativeTime(teacher.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <RoleGate allow={['admin']}>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                <Link 
                  to={`/teachers/${id}/edit`}
                  className="w-full btn-primary text-sm"
                >
                  Edit Teacher
                </Link>
                <button className="w-full btn-secondary text-sm">
                  View Schedule
                </button>
                <button className="w-full btn-secondary text-sm">
                  Assign Classes
                </button>
              </div>
            </div>
          </RoleGate>
        </div>
      </div>

      {/* Salary Update Modal */}
      {showSalaryModal && (
        <SalaryUpdateModal
          isOpen={showSalaryModal}
          teacher={teacher}
          onClose={() => setShowSalaryModal(false)}
        />
      )}

      {/* Bonus Modal */}
      {showBonusModal && (
        <BonusModal
          isOpen={showBonusModal}
          teacher={teacher}
          onClose={() => setShowBonusModal(false)}
        />
      )}
    </div>
  )
}

export default TeacherDetailPage