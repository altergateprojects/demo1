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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            📋 Expense Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Complete history of all changes and actions for this expense
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => navigate(`/expenses/${id}`)} variant="secondary">
            ← Back to Expense
          </Button>
          <Button onClick={() => navigate('/expenses')} variant="secondary">
            All Expenses
          </Button>
        </div>
      </div>

      {/* Expense Summary */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              {expense.description}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {expense.expense_number && (
                <Badge variant="secondary">#{expense.expense_number}</Badge>
              )}
              {expense.is_locked && (
                <Badge variant="danger">🔒 Locked</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              ₹{(expense.amount_paise / 100).toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {formatDate(expense.expense_date)}
            </div>
          </div>
        </div>
      </Card>

      {/* Security Information */}
      <Card className="p-4">
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
          🔐 Security & Integrity Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {expense.data_hash && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Data Hash:</span>
              <div className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all">
                {expense.data_hash}
              </div>
            </div>
          )}
          {expense.created_at && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Created:</span>
              <div className="text-slate-600 dark:text-slate-400">
                {formatDate(expense.created_at)}
              </div>
            </div>
          )}
          {expense.is_locked && expense.locked_at && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Locked:</span>
              <div className="text-red-600 dark:text-red-400">
                {formatDate(expense.locked_at)}
              </div>
            </div>
          )}
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-300">Audit Entries:</span>
            <div className="text-slate-600 dark:text-slate-400">
              {auditTrail.length} recorded actions
            </div>
          </div>
        </div>
      </Card>

      {/* Attachments Summary */}
      {attachments.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
            📎 Attached Documents ({attachments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{attachment.file_name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.file_type}
                  </div>
                  {attachment.file_hash && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Hash: {attachment.file_hash.substring(0, 16)}...
                    </div>
                  )}
                </div>
                <Button size="sm" variant="secondary">
                  View
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit Trail */}
      <Card className="p-6">
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">
          📋 Complete Audit Trail
        </h3>
        
        {auditTrail.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-400 text-4xl mb-2">📋</div>
            <p className="text-slate-600 dark:text-slate-400">
              No audit trail entries found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditTrail.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Timeline line */}
                {index < auditTrail.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-slate-200 dark:bg-slate-700"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-lg">
                    {getActionIcon(entry.action_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getActionBadgeVariant(entry.action_type)}>
                          {entry.action_type}
                        </Badge>
                        {entry.field_name && (
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Field: {entry.field_name === 'amount_paise' ? 'Amount' : 
                                   entry.field_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(entry.performed_at)}
                      </span>
                    </div>
                    
                    {/* Change details */}
                    {entry.old_value && entry.new_value && (
                      <div className="mb-2 p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium text-red-600 dark:text-red-400">Previous Value:</span>
                            <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              {entry.field_name === 'amount_paise' 
                                ? formatINR(Number(entry.old_value))
                                : entry.old_value
                              }
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-green-600 dark:text-green-400">New Value:</span>
                            <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              {entry.field_name === 'amount_paise' 
                                ? formatINR(Number(entry.new_value))
                                : entry.new_value
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Reason */}
                    <div className="mb-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Reason:</span>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        {entry.change_reason}
                      </p>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      {entry.performed_by_user?.full_name ? (
                        <span>
                          👤 {entry.performed_by_user.full_name}
                        </span>
                      ) : entry.performed_by ? (
                        <span>
                          👤 User ID: {entry.performed_by.substring(0, 8)}...
                        </span>
                      ) : (
                        <span>
                          👤 Unknown User
                        </span>
                      )}
                      {entry.ip_address && (
                        <span>
                          🌐 {entry.ip_address}
                        </span>
                      )}
                      {entry.session_id && (
                        <span className="font-mono">
                          🔑 {entry.session_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    
                    {/* Approval info */}
                    {entry.approved_by_user?.full_name && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        <span className="font-medium text-blue-700 dark:text-blue-300">
                          Approved by: {entry.approved_by_user.full_name}
                        </span>
                        {entry.approved_at && (
                          <span className="text-blue-600 dark:text-blue-400 ml-2">
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