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
    
    // Check if expense was updated
    const wasUpdated = expense.updated_at && expense.created_at && 
                       new Date(expense.updated_at).getTime() !== new Date(expense.created_at).getTime()
    
    if (wasUpdated) {
      badges.push(<Badge key="updated" variant="warning">✏️ Updated</Badge>)
    }
    
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
      {/* Modern Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                💰
              </div>
              
              {/* Title & Info */}
              <div>
                <div className="flex items-center space-x-2 text-red-100 text-sm mb-2">
                  <button onClick={() => navigate('/expenses')} className="hover:text-white transition-colors">
                    Expenses
                  </button>
                  <span>/</span>
                  <span className="text-white font-medium">Expense Details</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {expense.description}
                </h1>
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  {expense.expense_number && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      #{expense.expense_number}
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                    {EXPENSE_CATEGORIES.find(cat => cat.value === expense.category)?.label || expense.category}
                  </span>
                  {expense.is_locked ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-900/50 text-red-100 border border-red-400/30">
                      🔒 Locked
                    </span>
                  ) : expense.type === 'refund' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-100 border border-blue-400/30">
                      Refund
                    </span>
                  ) : !expense.needs_approval ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-100 border border-green-400/30">
                      ✅ Approved
                    </span>
                  ) : expense.is_approved === null ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-100 border border-yellow-400/30">
                      ⏳ Pending
                    </span>
                  ) : expense.is_approved ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-100 border border-green-400/30">
                      ✅ Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-900/50 text-red-100 border border-red-400/30">
                      ❌ Rejected
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/expenses')}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 transition-all duration-200"
              >
                ← Back
              </button>
              {!expense.is_locked && (
                <button 
                  onClick={() => navigate(`/expenses/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 bg-white hover:bg-red-50 text-red-700 font-medium rounded-lg shadow-lg transition-all duration-200"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-red-100 text-sm mb-1">Amount</div>
              <div className="text-white text-xl font-bold">{formatINR(expense.amount_paise)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-red-100 text-sm mb-1">Date</div>
              <div className="text-white text-lg font-semibold">{formatDate(expense.expense_date)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-red-100 text-sm mb-1">Payment Method</div>
              <div className="text-white text-lg font-semibold capitalize">{expense.payment_method?.replace('_', ' ')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-red-100 text-sm mb-1">Vendor</div>
              <div className="text-white text-lg font-semibold truncate">{expense.vendor_name || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Section: Vendor Information */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Vendor Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Vendor Name
                </label>
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  {expense.vendor_name || 'N/A'}
                </p>
              </div>
              {expense.vendor_phone && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">
                    {expense.vendor_phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700"></div>

          {/* Section: Payment Details */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Payment Method
                </label>
                <p className="text-slate-900 dark:text-slate-100 font-medium capitalize">
                  {expense.payment_method?.replace('_', ' ')}
                </p>
              </div>
              {expense.reference_number && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Reference Number
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium font-mono">
                    {expense.reference_number}
                  </p>
                </div>
              )}
              {expense.bill_number && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Bill Number
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium font-mono">
                    {expense.bill_number}
                  </p>
                </div>
              )}
              {expense.sub_category && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Sub Category
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">
                    {expense.sub_category}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700"></div>

          {/* Section: Security Information */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security & Integrity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expense.data_hash && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Data Hash
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-mono text-xs break-all">
                    {expense.data_hash}
                  </p>
                </div>
              )}
              {expense.created_at && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Created At
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">
                    {formatDate(expense.created_at)}
                  </p>
                </div>
              )}
              {expense.updated_at && expense.created_at && 
               new Date(expense.updated_at).getTime() !== new Date(expense.created_at).getTime() && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Last Updated
                  </label>
                  <p className="text-orange-600 dark:text-orange-400 font-medium">
                    ✏️ {formatDate(expense.updated_at)}
                  </p>
                </div>
              )}
              {expense.is_locked && expense.locked_at && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Locked At
                  </label>
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    🔒 {formatDate(expense.locked_at)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {(expense.approval_notes || expense.notes) && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700"></div>
              <div>
                <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Notes
                </h3>
                <div className="space-y-3">
                  {expense.approval_notes && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Approval Notes
                      </label>
                      <p className="text-blue-800 dark:text-blue-200">
                        {expense.approval_notes}
                      </p>
                    </div>
                  )}
                  {expense.notes && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Additional Notes
                      </label>
                      <p className="text-slate-900 dark:text-slate-100">
                        {expense.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
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