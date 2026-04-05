import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useExpenses } from '../../hooks/useExpenses'
import { useCurrentAcademicYear } from '../../hooks/useCommon'
import { EXPENSE_CATEGORIES } from '../../api/expenses.api'
import { formatINR, formatDate } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'
import AddExpenseModal from '../../components/shared/AddExpenseModal'

const ExpensesListPage = () => {
  const navigate = useNavigate()
  const { data: currentYear } = useCurrentAcademicYear()
  const [showAddModal, setShowAddModal] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    needsApproval: '',
    isApproved: ''
  })

  const { data: expenses, isLoading } = useExpenses({
    academicYearId: currentYear?.id,
    ...filters
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (!currentYear) return <LoadingScreen />

  const getStatusBadge = (expense) => {
    const badges = []
    
    // Fraud-proof indicators
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Expense Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track and manage school expenses for {currentYear.year_label}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            🔒 Add Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...EXPENSE_CATEGORIES
            ]}
          />

          <Input
            type="date"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />

          <Input
            type="date"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />

          <Select
            value={filters.needsApproval}
            onChange={(e) => handleFilterChange('needsApproval', e.target.value)}
            options={[
              { value: '', label: 'All Expenses' },
              { value: 'true', label: 'Needs Approval' },
              { value: 'false', label: 'No Approval Needed' }
            ]}
          />

          <Select
            value={filters.isApproved}
            onChange={(e) => handleFilterChange('isApproved', e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Approved' },
              { value: 'false', label: 'Rejected' },
              { value: 'null', label: 'Pending' }
            ]}
          />
        </div>
      </Card>

      {/* Expenses List */}
      {isLoading ? (
        <LoadingScreen />
      ) : !expenses?.length ? (
        <EmptyState
          title="No Expenses Found"
          description="No expenses found for the selected criteria."
          action={
            <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700 text-white">
              🔒 Add Expense
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                      {expense.description}
                    </h3>
                    <div className="flex items-center space-x-2 flex-wrap">
                      {getStatusBadge(expense)}
                      <Badge variant="secondary">
                        {EXPENSE_CATEGORIES.find(cat => cat.value === expense.category)?.label || expense.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Amount: {formatINR(expense.amount_paise)}</span>
                    <span>Date: {formatDate(expense.expense_date)}</span>
                    <span>Method: {expense.payment_method.replace('_', ' ')}</span>
                    <span>Bill #: {expense.bill_number || 'N/A'}</span>
                    {expense.created_at && (
                      <span>Created: {formatDate(expense.created_at)}</span>
                    )}
                  </div>

                  {/* Fraud-proof indicators */}
                  <div className="mt-2 flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                    {expense.data_hash && (
                      <span className="font-mono">🔐 Hash: {expense.data_hash.substring(0, 8)}...</span>
                    )}
                    {expense.is_locked && expense.locked_at && (
                      <span className="text-red-600">🔒 Locked: {formatDate(expense.locked_at)}</span>
                    )}
                    <span>📝 Audit Trail Available</span>
                  </div>

                  {expense.vendor_name && (
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Vendor: {expense.vendor_name}
                      {expense.vendor_phone && ` (${expense.vendor_phone})`}
                    </div>
                  )}

                  {expense.reference_number && (
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Reference: {expense.reference_number}
                    </div>
                  )}

                  {expense.sub_category && (
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Sub-category: {expense.sub_category}
                    </div>
                  )}

                  {expense.approval_notes && (
                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                      <span className="font-medium">Approval Notes:</span> {expense.approval_notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {expense.needs_approval && expense.is_approved === null && !expense.is_locked && (
                    <>
                      <Button
                        onClick={() => navigate(`/expenses/${expense.id}/approve`)}
                        variant="success"
                        size="sm"
                      >
                        ✅ Approve
                      </Button>
                      <Button
                        onClick={() => navigate(`/expenses/${expense.id}/reject`)}
                        variant="danger"
                        size="sm"
                      >
                        ❌ Reject
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                    variant="secondary"
                    size="sm"
                  >
                    👁️ View
                  </Button>
                  {!expense.is_locked && (
                    <Button
                      onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                      variant="secondary"
                      size="sm"
                    >
                      ✏️ Edit
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate(`/expenses/${expense.id}/audit`)}
                    variant="secondary"
                    size="sm"
                  >
                    📋 Audit Trail
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}

export default ExpensesListPage