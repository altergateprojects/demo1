import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExpense } from '../../hooks/useExpenses'
import { getExpenseAttachments, getExpenseAuditTrail } from '../../api/expenses.api'
import { supabase } from '../../lib/supabase'
import { formatINR, formatDate } from '../../lib/formatters'
import { EXPENSE_CATEGORIES } from '../../api/expenses.api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'
import Modal from '../../components/ui/Modal'

const ExpenseDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: expense, isLoading } = useExpense(id)
  const [attachments, setAttachments] = useState([])
  const [auditTrail, setAuditTrail] = useState([])
  const [showAttachments, setShowAttachments] = useState(false)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)

  const loadAttachments = async () => {
    setLoadingAttachments(true)
    try {
      const data = await getExpenseAttachments(id)
      setAttachments(data)
      setShowAttachments(true)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoadingAttachments(false)
    }
  }

  const loadAuditTrail = async () => {
    setLoadingAudit(true)
    try {
      const data = await getExpenseAuditTrail(id)
      setAuditTrail(data)
      setShowAuditTrail(true)
    } catch (error) {
      console.error('Error loading audit trail:', error)
    } finally {
      setLoadingAudit(false)
    }
  }

  if (isLoading) return <LoadingScreen />
  if (!expense) return <div>Expense not found</div>

  const getStatusBadge = () => {
    const badges = []
    
    if (expense.is_locked) {
      badges.push(<Badge key="locked" variant="danger">🔒 Locked</Badge>)
    }
    
    if (expense.expense_number) {
      badges.push(<Badge key="number" variant="secondary">#{expense.expense_number}</Badge>)
    }
    
    if (expense.type === 'refund') {
      badges.push(<Badge key="refund" variant="info">Refund</Badge>)
    } else if (!expense.needs_approval) {
      badges.push(<Badge key="approved" variant="success">✅ Approved</Badge>)
    } else if (expense.is_approved === null) {
      badges.push(<Badge key="pending" variant="warning">⏳ Pending Approval</Badge>)
    } else if (expense.is_approved) {
      badges.push(<Badge key="approved" variant="success">✅ Approved</Badge>)
    } else {
      badges.push(<Badge key="rejected" variant="danger">❌ Rejected</Badge>)
    }
    
    return badges
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Expense Details
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View complete expense information and audit trail
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => navigate('/expenses')} variant="secondary">
            ← Back to Expenses
          </Button>
          {!expense.is_locked && (
            <Button onClick={() => navigate(`/expenses/${id}/edit`)}>
              ✏️ Edit
            </Button>
          )}
        </div>
      </div>

      {/* Main Details */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {expense.description}
            </h2>
            <div className="flex items-center space-x-2 mt-2 flex-wrap">
              {getStatusBadge()}
              <Badge variant="secondary">
                {EXPENSE_CATEGORIES.find(cat => cat.value === expense.category)?.label || expense.category}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatINR(expense.amount_paise)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {formatDate(expense.expense_date)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Vendor Information
              </label>
              <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                <div>{expense.vendor_name || 'N/A'}</div>
                {expense.vendor_phone && (
                  <div className="text-slate-600 dark:text-slate-400">{expense.vendor_phone}</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Payment Details
              </label>
              <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                <div>Method: {expense.payment_method?.replace('_', ' ')}</div>
                {expense.reference_number && (
                  <div>Reference: {expense.reference_number}</div>
                )}
                {expense.bill_number && (
                  <div>Bill #: {expense.bill_number}</div>
                )}
              </div>
            </div>

            {expense.sub_category && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sub Category
                </label>
                <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {expense.sub_category}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Fraud-proof information */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Security Information
              </label>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {expense.data_hash && (
                  <div className="font-mono">🔐 Hash: {expense.data_hash.substring(0, 16)}...</div>
                )}
                {expense.created_at && (
                  <div>📅 Created: {formatDate(expense.created_at)}</div>
                )}
                {expense.is_locked && expense.locked_at && (
                  <div className="text-red-600">🔒 Locked: {formatDate(expense.locked_at)}</div>
                )}
              </div>
            </div>

            {expense.approval_notes && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Approval Notes
                </label>
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                  {expense.approval_notes}
                </div>
              </div>
            )}

            {expense.notes && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Additional Notes
                </label>
                <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {expense.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex space-x-3">
            <Button
              onClick={loadAttachments}
              loading={loadingAttachments}
              variant="secondary"
            >
              📎 View Attachments
            </Button>
            <Button
              onClick={loadAuditTrail}
              loading={loadingAudit}
              variant="secondary"
            >
              📋 View Audit Trail
            </Button>
          </div>
        </div>
      </Card>

      {/* Attachments Modal */}
      <Modal
        isOpen={showAttachments}
        onClose={() => setShowAttachments(false)}
        title="📎 Expense Attachments"
        size="lg"
      >
        <div className="space-y-4">
          {attachments.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No attachments found.</p>
          ) : (
            attachments.map((attachment) => {
              const isImage = attachment.file_type?.startsWith('image/')
              const isPDF = attachment.file_type === 'application/pdf'
              
              return (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{attachment.file_name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.file_type}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Hash: {attachment.file_hash?.substring(0, 16)}...
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={async () => {
                        try {
                          const { data, error } = supabase.storage
                            .from('expense-attachments')
                            .getPublicUrl(attachment.storage_path)
                          
                          if (error) {
                            alert('❌ Storage bucket not found. Please run fix-bucket-make-public.sql')
                            return
                          }
                          
                          if (data?.publicUrl) {
                            setPreviewAttachment({
                              ...attachment,
                              url: data.publicUrl,
                              isImage,
                              isPDF
                            })
                          }
                        } catch (err) {
                          alert('❌ Error loading attachment')
                        }
                      }}
                      size="sm"
                      variant="primary"
                    >
                      {isImage ? '👁️ Preview' : '📄 View'}
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const { data } = supabase.storage
                            .from('expense-attachments')
                            .getPublicUrl(attachment.storage_path)
                          
                          if (data?.publicUrl) {
                            window.open(data.publicUrl, '_blank')
                          }
                        } catch (err) {
                          alert('❌ Error opening attachment')
                        }
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      ↗️
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Modal>

      {/* Attachment Preview Modal */}
      <Modal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        title={previewAttachment?.file_name || 'Preview'}
        size="xl"
      >
        {previewAttachment && (
          <div className="space-y-4">
            {previewAttachment.isImage ? (
              <div className="flex justify-center bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.file_name}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
                <div style={{ display: 'none' }} className="text-center text-slate-600 dark:text-slate-400">
                  <p>❌ Failed to load image</p>
                  <p className="text-sm mt-2">The image may be corrupted or the bucket may not be public.</p>
                </div>
              </div>
            ) : previewAttachment.isPDF ? (
              <div className="w-full h-[70vh] bg-slate-100 dark:bg-slate-900 rounded-lg">
                <iframe
                  src={previewAttachment.url}
                  className="w-full h-full rounded-lg"
                  title={previewAttachment.file_name}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Preview not available for this file type
                </p>
                <Button
                  onClick={() => window.open(previewAttachment.url, '_blank')}
                >
                  Open in New Tab
                </Button>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {(previewAttachment.file_size / 1024).toFixed(1)} KB • {previewAttachment.file_type}
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => window.open(previewAttachment.url, '_blank')}
                  variant="secondary"
                  size="sm"
                >
                  Open in New Tab ↗️
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = previewAttachment.url
                    link.download = previewAttachment.file_name
                    link.click()
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Download 📥
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Audit Trail Modal */}
      <Modal
        isOpen={showAuditTrail}
        onClose={() => setShowAuditTrail(false)}
        title="📋 Audit Trail"
        size="xl"
      >
        <div className="space-y-4">
          {auditTrail.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No audit trail found.</p>
          ) : (
            auditTrail.map((entry) => (
              <div key={entry.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={
                    entry.action_type === 'CREATE' ? 'success' :
                    entry.action_type === 'UPDATE' ? 'warning' :
                    entry.action_type === 'APPROVE' ? 'success' :
                    entry.action_type === 'REJECT' ? 'danger' :
                    entry.action_type === 'LOCK' ? 'danger' : 'secondary'
                  }>
                    {entry.action_type}
                  </Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(entry.performed_at)}
                  </span>
                </div>
                
                {entry.field_name && (
                  <div className="mb-2">
                    <span className="font-medium">Field:</span> {entry.field_name === 'amount_paise' ? 'Amount' : entry.field_name}
                    {entry.old_value && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="text-red-600">Old:</span> {
                          entry.field_name === 'amount_paise' 
                            ? formatINR(Number(entry.old_value))
                            : entry.old_value
                        } →{' '}
                        <span className="text-green-600">New:</span> {
                          entry.field_name === 'amount_paise' 
                            ? formatINR(Number(entry.new_value))
                            : entry.new_value
                        }
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-sm">
                  <span className="font-medium">Reason:</span> {entry.change_reason}
                </div>
                
                {entry.performed_by_user && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">By:</span> {entry.performed_by_user.full_name}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ExpenseDetailPage