import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStudent, useStudentFeeHistory } from '../../hooks/useStudents'
import RoleGate from '../../components/shared/RoleGate'
import FeePaymentModal from '../../components/shared/FeePaymentModal'
import PocketMoneyModal from '../../components/shared/PocketMoneyModal'
import TransactionHistoryModal from '../../components/shared/TransactionHistoryModal'
import StudentFinancialHistoryModal from '../../components/shared/StudentFinancialHistoryModal'
import { formatINR } from '../../lib/formatters'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'

const StudentDetailPage = () => {
  const { id } = useParams()
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showPocketMoneyModal, setShowPocketMoneyModal] = useState(false)
  const [pocketMoneyType, setPocketMoneyType] = useState('credit')
  const [showFeeHistoryModal, setShowFeeHistoryModal] = useState(false)
  const [showPocketHistoryModal, setShowPocketHistoryModal] = useState(false)
  const [showFinancialHistoryModal, setShowFinancialHistoryModal] = useState(false)
  
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
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
            <Link to="/students" className="hover:text-slate-900 dark:hover:text-slate-100">
              Students
            </Link>
            <span>/</span>
            <span>{student.full_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {student.full_name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Roll No: {student.roll_number} • {student.standards?.name}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFinancialHistoryModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Financial History
          </button>
          <RoleGate allow={['admin', 'finance']}>
            <button 
              onClick={() => setShowFeeModal(true)}
              className="btn-primary"
            >
              Record Payment
            </button>
          </RoleGate>
          <RoleGate allow={['admin', 'finance']}>
            <Link to={`/students/${id}/edit`} className="btn-secondary">
              Edit Student
            </Link>
          </RoleGate>
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
    </div>
  )
}

export default StudentDetailPage