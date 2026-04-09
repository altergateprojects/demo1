import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTeacher } from '../../hooks/useTeachers'
import { useTeacherSalaryPayments, useTeacherBonuses } from '../../hooks/useTeacherSalary'
import RoleGate from '../../components/shared/RoleGate'
import SalaryUpdateModal from '../../components/shared/SalaryUpdateModal'
import BonusModal from '../../components/shared/BonusModal'
import { formatINR, formatPhone, formatDate } from '../../lib/formatters'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'

const TeacherDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)
  
  const { data: teacher, isLoading, error } = useTeacher(id)
  const { data: salaryPayments, isLoading: paymentsLoading } = useTeacherSalaryPayments(id)
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

  const InfoRow = ({ label, value, link }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      {link ? (
        <a href={link} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
          {value}
        </a>
      ) : (
        <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">{value}</span>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Compact Header with Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
          <button onClick={() => navigate('/teachers')} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Teachers
          </button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 dark:text-slate-100">{teacher.full_name}</span>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar with Initial */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {teacher.full_name.charAt(0)}
              </span>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {teacher.full_name}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  teacher.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {teacher.status}
                </span>
                {teacher.subject && (
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {teacher.subject}
                  </span>
                )}
                {teacher.experience_years !== null && teacher.experience_years !== undefined && (
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    • {teacher.experience_years} {teacher.experience_years === 1 ? 'year' : 'years'} exp
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <RoleGate allow={['admin', 'finance']}>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowSalaryModal(true)}
                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Update Salary
              </button>
              <button 
                onClick={() => setShowBonusModal(true)}
                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Add Bonus
              </button>
              <Link 
                to={`/teachers/${id}/edit`}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Edit
              </Link>
            </div>
          </RoleGate>
        </div>
      </div>

      {/* Information Grid - Clean & Dense */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Personal Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="space-y-0">
                  <InfoRow label="Full Name" value={teacher.full_name} />
                  <InfoRow label="Status" value={teacher.status} />
                  {teacher.qualification && (
                    <InfoRow label="Qualification" value={teacher.qualification} />
                  )}
                </div>
                <div className="space-y-0">
                  {teacher.subject && (
                    <InfoRow label="Subject" value={teacher.subject} />
                  )}
                  {teacher.experience_years !== null && teacher.experience_years !== undefined && (
                    <InfoRow 
                      label="Experience" 
                      value={`${teacher.experience_years} ${teacher.experience_years === 1 ? 'year' : 'years'}`} 
                    />
                  )}
                  <InfoRow 
                    label="Joined" 
                    value={formatDate(teacher.created_at)} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Contact Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="space-y-0">
                  <InfoRow 
                    label="Email" 
                    value={teacher.email || '—'} 
                    link={teacher.email ? `mailto:${teacher.email}` : null}
                  />
                  <InfoRow 
                    label="Phone" 
                    value={teacher.phone ? formatPhone(teacher.phone) : '—'} 
                    link={teacher.phone ? `tel:${teacher.phone}` : null}
                  />
                </div>
                <div className="space-y-0">
                  {teacher.emergency_contact && (
                    <InfoRow label="Emergency Contact" value={teacher.emergency_contact} />
                  )}
                  {teacher.emergency_phone && (
                    <InfoRow 
                      label="Emergency Phone" 
                      value={formatPhone(teacher.emergency_phone)} 
                      link={`tel:${teacher.emergency_phone}`}
                    />
                  )}
                </div>
              </div>
              {teacher.address && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Address</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{teacher.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Card - Only if notes exist */}
          {teacher.notes && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Additional Notes
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {teacher.notes}
                </p>
              </div>
            </div>
          )}

          {/* Salary Payment History - Finance/Admin Only */}
          <RoleGate allow={['admin', 'finance']}>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Payment History
                </h2>
              </div>
              <div className="p-6">
                {paymentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : salaryPayments && salaryPayments.length > 0 ? (
                  <div className="space-y-3">
                    {salaryPayments.slice(0, 5).map((payment) => (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {formatINR(payment.total_amount_paise || 0)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(payment.salary_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} • {formatDate(payment.payment_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : payment.status === 'partial'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {payment.status}
                          </span>
                          {payment.payment_method && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {payment.payment_method.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    No payments recorded yet
                  </p>
                )}
              </div>
            </div>
          </RoleGate>

          {/* Bonuses - Finance/Admin Only */}
          <RoleGate allow={['admin', 'finance']}>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Bonuses & Incentives
                </h2>
              </div>
              <div className="p-6">
                {bonusesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : bonuses && bonuses.length > 0 ? (
                  <div className="space-y-3">
                    {bonuses.slice(0, 5).map((bonus) => (
                      <div 
                        key={bonus.id}
                        className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            +{formatINR(bonus.amount_paise)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(bonus.bonus_date)} • {bonus.bonus_type || 'Bonus'}
                          </p>
                        </div>
                        {bonus.reason && (
                          <span className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {bonus.reason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    No bonuses recorded
                  </p>
                )}
              </div>
            </div>
          </RoleGate>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Salary Summary - Finance/Admin Only */}
          <RoleGate allow={['admin', 'finance']}>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800 p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-2">
                  Current Monthly Salary
                </p>
                <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                  {formatINR(teacher.current_salary_paise || 0)}
                </p>
                {teacher.salary_effective_date && (
                  <p className="text-xs text-primary-700 dark:text-primary-300 mt-2">
                    Since {formatDate(teacher.salary_effective_date)}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-700 space-y-2">
                <button 
                  onClick={() => setShowSalaryModal(true)}
                  className="w-full px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Update Salary
                </button>
                <button 
                  onClick={() => setShowBonusModal(true)}
                  className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                >
                  Add Bonus
                </button>
              </div>
            </div>
          </RoleGate>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wide">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  teacher.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {teacher.status}
                </span>
              </div>
              
              {teacher.experience_years !== null && teacher.experience_years !== undefined && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Experience</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {teacher.experience_years} {teacher.experience_years === 1 ? 'year' : 'years'}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Joined</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(teacher.created_at)}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(teacher.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSalaryModal && (
        <SalaryUpdateModal
          isOpen={showSalaryModal}
          teacher={teacher}
          onClose={() => setShowSalaryModal(false)}
        />
      )}

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
