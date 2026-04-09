import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExpense } from '../../hooks/useExpenses'
import { getExpenseAuditTrail, getExpenseAttachments } from '../../api/expenses.api'
import { formatDate, formatINR } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'

const ExpenseAuditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: expense, isLoading: expenseLoading } = useExpense(id)
  const [auditTrail, setAuditTrail] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAuditData = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const [auditData, attachmentData] = await Promise.all([
          getExpenseAuditTrail(id),
          getExpenseAttachments(id)
        ])
        
        setAuditTrail(auditData)
        setAttachments(attachmentData)
      } catch (error) {
        console.error('Error loading audit data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAuditData()
  }, [id])

  if (expenseLoading || loading) return <LoadingScreen />
  if (!expense) return <div>Expense not found</div>

  const getActionBadgeVariant = (actionType) => {
    switch (actionType) {
      case 'CREATE': return 'success'
      case 'UPDATE': return 'warning'
      case 'APPROVE': return 'success'
      case 'REJECT': return 'danger'
      case 'LOCK': return 'danger'
      case 'SOFT_DELETE': return 'danger'
      case 'RESTORE': return 'success'
      default: return 'secondary'
    }
  }

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'CREATE': return '✨'
      case 'UPDATE': return '✏️'
      case 'APPROVE': return '✅'
      case 'REJECT': return '❌'
      case 'LOCK': return '🔒'
      case 'SOFT_DELETE': return '🗑️'
      case 'RESTORE': return '♻️'
      default: return '📝'
    }
  }

  return (
    <div className="space-y-6">
      {/* Modern Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                🔍
              </div>
              
              {/* Title & Info */}
              <div>
                <div className="flex items-center space-x-2 text-red-100 text-sm mb-2">
                  <button onClick={() => navigate('/expenses')} className="hover:text-white transition-colors">
                    Expenses
                  </button>
                  <span>/</span>
                  <button onClick={() => navigate(`/expenses/${id}`)} className="hover:text-white transition-colors">
                    Details
                  </button>
                  <span>/</span>
                  <span className="text-white font-medium">Audit Trail</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Expense Audit Trail
                </h1>
                <p className="text-red-100">
                  Complete history of all changes and actions
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate(`/expenses/${id}`)}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 transition-all duration-200"
              >
                ← Back to Expense
              </button>
              <button 
                onClick={() => navigate('/expenses')}
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-red-50 text-red-700 font-medium rounded-lg shadow-lg transition-all duration-200"
              >
                All Expenses
              </button>
            </div>
          </div>
          
          {/* Stats Cards */}
          {expense && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-red-100 text-sm mb-1">Expense</div>
                <div className="text-white text-lg font-bold truncate">{expense.description}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-red-100 text-sm mb-1">Amount</div>
                <div className="text-white text-xl font-bold">₹{(expense.amount_paise / 100).toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-red-100 text-sm mb-1">Audit Entries</div>
                <div className="text-white text-xl font-bold">{auditTrail.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-red-100 text-sm mb-1">Attachments</div>
                <div className="text-white text-xl font-bold">{attachments.length}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Summary */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {expense.description}
              </h3>
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                {expense.expense_number && (
                  <Badge variant="secondary">#{expense.expense_number}</Badge>
                )}
                {expense.is_locked && (
                  <Badge variant="danger">🔒 Locked</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ₹{(expense.amount_paise / 100).toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {formatDate(expense.expense_date)}
            </div>
          </div>
        </div>
      </Card>

      {/* Security Information */}
      <Card className="p-6">
        <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Security & Integrity Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expense.data_hash && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Data Hash
              </label>
              <p className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all">
                {expense.data_hash}
              </p>
            </div>
          )}
          {expense.created_at && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Created
              </label>
              <p className="text-slate-900 dark:text-slate-100 font-medium">
                {formatDate(expense.created_at)}
              </p>
            </div>
          )}
          {expense.is_locked && expense.locked_at && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                Locked
              </label>
              <p className="text-red-900 dark:text-red-100 font-medium">
                🔒 {formatDate(expense.locked_at)}
              </p>
            </div>
          )}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Audit Entries
            </label>
            <p className="text-slate-900 dark:text-slate-100 font-medium">
              {auditTrail.length} recorded actions
            </p>
          </div>
        </div>
      </Card>

      {/* Attachments Summary */}
      {attachments.length > 0 && (
        <Card className="p-6">
          <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attached Documents ({attachments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                    {attachment.file_name}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.file_type}
                  </div>
                  {attachment.file_hash && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                      Hash: {attachment.file_hash.substring(0, 16)}...
                    </div>
                  )}
                </div>
                <Button size="sm" variant="secondary" className="ml-3">
                  View
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit Trail */}
      <Card className="p-6">
        <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
          <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Complete Audit Trail
        </h3>
        
        {auditTrail.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              No audit trail entries found.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {auditTrail.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Timeline line */}
                {index < auditTrail.length - 1 && (
                  <div className="absolute left-6 top-14 w-0.5 h-full bg-slate-200 dark:bg-slate-700 -z-10"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Timeline dot with icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-xl shadow-lg border-4 border-white dark:border-slate-900">
                    {getActionIcon(entry.action_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getActionBadgeVariant(entry.action_type)}>
                          {entry.action_type}
                        </Badge>
                        {entry.field_name && (
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Field: <span className="font-medium text-slate-900 dark:text-slate-100">
                              {entry.field_name === 'amount_paise' ? 'Amount' : 
                               entry.field_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {formatDate(entry.performed_at)}
                      </span>
                    </div>
                    
                    {/* Change details */}
                    {entry.old_value && entry.new_value && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Previous Value</div>
                          <div className="text-sm text-red-900 dark:text-red-100 font-medium">
                            {entry.field_name === 'amount_paise' 
                              ? formatINR(Number(entry.old_value))
                              : entry.old_value
                            }
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">New Value</div>
                          <div className="text-sm text-green-900 dark:text-green-100 font-medium">
                            {entry.field_name === 'amount_paise' 
                              ? formatINR(Number(entry.new_value))
                              : entry.new_value
                            }
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Reason */}
                    <div className="mb-3">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason: </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {entry.change_reason}
                      </span>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                      {entry.performed_by_user?.full_name ? (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {entry.performed_by_user.full_name}
                        </span>
                      ) : entry.performed_by ? (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          User ID: {entry.performed_by.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Unknown User
                        </span>
                      )}
                      {entry.ip_address && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          {entry.ip_address}
                        </span>
                      )}
                      {entry.session_id && (
                        <span className="flex items-center font-mono">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          {entry.session_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    
                    {/* Approval info */}
                    {entry.approved_by_user?.full_name && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Approved by: {entry.approved_by_user.full_name}
                        </span>
                        {entry.approved_at && (
                          <span className="text-sm text-blue-600 dark:text-blue-400 ml-2">
                            on {formatDate(entry.approved_at)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Fraud Prevention Notice */}
      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              🔒 Fraud-Proof System Active
            </h3>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              This audit trail is immutable and cannot be modified or deleted. All actions are permanently recorded with cryptographic integrity verification for complete financial transparency.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ExpenseAuditPage