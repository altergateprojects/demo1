import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStudent, useStudentFeeHistory } from '../../hooks/useStudents'
import RoleGate from '../../components/shared/RoleGate'
import FeePaymentModal from '../../components/shared/FeePaymentModal'
import PocketMoneyModal from '../../components/shared/PocketMoneyModal'
import TransactionHistoryModal from '../../components/shared/TransactionHistoryModal'
import StudentFinancialHistoryModal from '../../components/shared/StudentFinancialHistoryModal'
import DeleteStudentModal from '../../components/shared/DeleteStudentModal'
import { formatINR } from '../../lib/formatters'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'

const StudentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showPocketMoneyModal, setShowPocketMoneyModal] = useState(false)
  const [pocketMoneyType, setPocketMoneyType] = useState('credit')
  const [showFeeHistoryModal, setShowFeeHistoryModal] = useState(false)
  const [showPocketHistoryModal, setShowPocketHistoryModal] = useState(false)
  const [showFinancialHistoryModal, setShowFinancialHistoryModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const { data: student, isLoading, error } = useStudent(id)
  const { data: feeHistory, isLoading: feeHistoryLoading } = useStudentFeeHistory(id)

  if (isLoading) return <LoadingScreen />
  
  if (error || !student) {
    return (
      <EmptyState
        title="Student Not Found"
        description="The student you're looking for doesn't exist or has been deleted."
        action={
          <Link to="/students" className="btn-primary">
            Back to Students
          </Link>
        }
      />
    )
  }

  const feeProgress = student.annual_fee_paise > 0 
    ? (student.fee_paid_paise / student.annual_fee_paise) * 100 
    : 0

  const handlePocketMoneyAction = (type) => {
    setPocketMoneyType(type)
    setShowPocketMoneyModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Modern Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                👨‍🎓
              </div>
              
              {/* Title & Info */}
              <div>
                <div className="flex items-center space-x-2 text-indigo-100 text-sm mb-2">
                  <Link to="/students" className="hover:text-white transition-colors">
                    Students
                  </Link>
                  <span>/</span>
                  <span className="text-white font-medium">{student.full_name}</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {student.full_name}
                </h1>
                <div className="flex items-center space-x-4 text-indigo-100">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Roll No: {student.roll_number}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {student.standards?.name}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    student.status === 'active' 
                      ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                      : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
                  }`}>
                    {student.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFinancialHistoryModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Financial History
              </button>
              <RoleGate allow={['admin', 'finance']}>
                <button 
                  onClick={() => setShowFeeModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 font-medium rounded-lg shadow-lg transition-all duration-200"
                >
                  💰 Record Payment
                </button>
              </RoleGate>
              <RoleGate allow={['admin', 'finance']}>
                <Link 
                  to={`/students/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 transition-all duration-200"
                >
                  ✏️ Edit
                </Link>
              </RoleGate>
              <RoleGate allow={['admin']}>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </RoleGate>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-indigo-100 text-sm mb-1">Annual Fee</div>
              <div className="text-white text-xl font-bold">{formatINR(student.annual_fee_paise)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-indigo-100 text-sm mb-1">Paid</div>
              <div className="text-green-300 text-xl font-bold">{formatINR(student.fee_paid_paise)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-indigo-100 text-sm mb-1">Pending</div>
              <div className="text-red-300 text-xl font-bold">
                {formatINR(Math.max(0, student.annual_fee_paise - student.fee_paid_paise))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-indigo-100 text-sm mb-1">Pocket Money</div>
              <div className="text-white text-xl font-bold">{formatINR(student.pocket_money_paise)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
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
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{student.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Roll Number
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{student.roll_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Standard
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{student.standards?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  student.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {student.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Gender
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 capitalize">{student.gender}</p>
              </div>
              {student.dob && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date of Birth
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {new Date(student.dob).toLocaleDateString('en-IN')}
                  </p>
                </div>
              )}
              {student.admission_date && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Admission Date
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {new Date(student.admission_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.guardian_name && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Guardian Name
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{student.guardian_name}</p>
                </div>
              )}
              {student.phone && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{student.phone}</p>
                </div>
              )}
              {student.alt_phone && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Alternate Phone
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{student.alt_phone}</p>
                </div>
              )}
              {student.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Address
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{student.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fee History - Finance/Admin Only */}
          <RoleGate allow={['admin', 'finance']}>
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Fee Payment History
                </h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowFeeHistoryModal(true)}
                    className="btn-secondary text-sm"
                  >
                    View All
                  </button>
                  <button 
                    onClick={() => setShowFeeModal(true)}
                    className="btn-primary text-sm"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
              
              {feeHistoryLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : feeHistory && feeHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                          Receipt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {feeHistory.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                            {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                            {formatINR(payment.amount_paise)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 capitalize">
                            {payment.payment_method.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                            {payment.receipt_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No fee payments recorded yet
                </div>
              )}
            </div>
          </RoleGate>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fee Summary - Finance/Admin/Staff */}
          <RoleGate allow={['admin', 'finance', 'staff']}>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Fee Summary
              </h3>
              <div className="space-y-3">
                {/* Previous Years Pending (if any) */}
                {student.previous_years_pending_paise > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Previous Years Pending:</span>
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {formatINR(student.previous_years_pending_paise)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3"></div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Annual Fee (Current Year):</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatINR(student.annual_fee_paise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Paid:</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatINR(student.fee_paid_paise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Pending (Current Year):</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {formatINR(Math.max(0, student.annual_fee_paise - student.fee_paid_paise))}
                  </span>
                </div>
                
                {/* Total Pending (if previous years exist) */}
                {student.previous_years_pending_paise > 0 && (
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3 bg-red-50 dark:bg-red-900/10 -mx-6 px-6 py-3 mt-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Total Pending:</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {formatINR((student.previous_years_pending_paise || 0) + Math.max(0, student.annual_fee_paise - student.fee_paid_paise))}
                    </span>
                  </div>
                )}
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <span>Payment Progress</span>
                    <span>{Math.round(feeProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${feeProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons - only for admin/finance */}
              <RoleGate allow={['admin', 'finance']}>
                <div className="mt-4 space-y-2">
                  <button 
                    onClick={() => setShowFeeModal(true)}
                    className="w-full btn-primary text-sm"
                  >
                    Record Payment
                  </button>
                  <button 
                    onClick={() => setShowFeeHistoryModal(true)}
                    className="w-full btn-secondary text-sm"
                  >
                    View Payment History
                  </button>
                </div>
              </RoleGate>
              
              {/* View-only for staff */}
              <RoleGate allow={['staff']} fallback={null}>
                <div className="mt-4">
                  <button 
                    onClick={() => setShowFeeHistoryModal(true)}
                    className="w-full btn-secondary text-sm"
                  >
                    View Payment History
                  </button>
                </div>
              </RoleGate>
            </div>
          </RoleGate>



          {/* Pocket Money - Finance/Admin Only */}
          <RoleGate allow={['admin', 'finance']}>
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Pocket Money
                </h3>
                <button 
                  onClick={() => setShowPocketHistoryModal(true)}
                  className="text-sm text-primary-600 hover:text-primary-900 dark:text-primary-400"
                >
                  View History
                </button>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(student.pocket_money_paise)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Current Balance
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <button 
                  onClick={() => handlePocketMoneyAction('credit')}
                  className="w-full btn-primary text-sm"
                >
                  Add Credit
                </button>
                <button 
                  onClick={() => handlePocketMoneyAction('debit')}
                  className="w-full btn-secondary text-sm"
                >
                  Record Debit
                </button>
              </div>
            </div>
          </RoleGate>

          {/* Student Photo */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Student Photo
            </h3>
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-slate-500 dark:text-slate-400">
                  {student.full_name.charAt(0)}
                </span>
              </div>
            </div>
            <RoleGate allow={['admin', 'finance']}>
              <button className="w-full mt-4 btn-secondary text-sm">
                Upload Photo
              </button>
            </RoleGate>
          </div>
        </div>
      </div>

      {/* Fee Payment Modal */}
      {showFeeModal && (
        <FeePaymentModal
          isOpen={showFeeModal}
          student={student}
          onClose={() => setShowFeeModal(false)}
        />
      )}

      {/* Pocket Money Modal */}
      {showPocketMoneyModal && (
        <PocketMoneyModal
          isOpen={showPocketMoneyModal}
          student={student}
          type={pocketMoneyType}
          onClose={() => setShowPocketMoneyModal(false)}
        />
      )}

      {/* Fee History Modal */}
      {showFeeHistoryModal && (
        <TransactionHistoryModal
          isOpen={showFeeHistoryModal}
          student={student}
          type="fee"
          onClose={() => setShowFeeHistoryModal(false)}
        />
      )}

      {/* Pocket Money History Modal */}
      {showPocketHistoryModal && (
        <TransactionHistoryModal
          isOpen={showPocketHistoryModal}
          student={student}
          type="pocket_money"
          onClose={() => setShowPocketHistoryModal(false)}
        />
      )}

      {/* Complete Financial History Modal */}
      <StudentFinancialHistoryModal
        isOpen={showFinancialHistoryModal}
        onClose={() => setShowFinancialHistoryModal(false)}
        student={student}
      />

      {/* Delete Student Modal */}
      {showDeleteModal && (
        <DeleteStudentModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          student={student}
          onDeleteSuccess={() => {
            setShowDeleteModal(false)
            navigate('/students')
          }}
        />
      )}
    </div>
  )
}

export default StudentDetailPage