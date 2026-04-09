import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useExpenses } from '../../hooks/useExpenses'
import { useCurrentAcademicYear, useAcademicYears } from '../../hooks/useCommon'
import { EXPENSE_CATEGORIES } from '../../api/expenses.api'
import { getDashboardSummary } from '../../api/dashboard.api'
import { getTotalActiveBorrowedCapital } from '../../api/borrowedCapital.api'
import { formatINR, formatDate } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'
import AddExpenseModal from '../../components/shared/AddExpenseModal'
import BorrowCapitalModal from '../../components/shared/BorrowCapitalModal'
import ExpenseGraphModal from '../../components/shared/ExpenseGraphModal'

const ExpensesListPage = () => {
  const navigate = useNavigate()
  const { data: currentYear } = useCurrentAcademicYear()
  const { data: academicYears } = useAcademicYears()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showGraphModal, setShowGraphModal] = useState(false)
  const [selectedYearId, setSelectedYearId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [availableFunds, setAvailableFunds] = useState(0)
  const [borrowedCapital, setBorrowedCapital] = useState(0)
  const itemsPerPage = 20
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    needsApproval: '',
    isApproved: ''
  })

  const { data: expenses, isLoading } = useExpenses({
    academicYearId: selectedYearId || currentYear?.id,
    ...filters
  })

  // Fetch available funds
  useEffect(() => {
    const fetchAvailableFunds = async () => {
      if (!currentYear?.id) return
      
      try {
        const summary = await getDashboardSummary(currentYear.id)
        const borrowed = await getTotalActiveBorrowedCapital(currentYear.id)
        
        // Calculate: Fees Collected + Positive Pocket Money + Borrowed Capital
        const positivePocketMoney = Math.max(0, -summary.totalNegativePocketMoney) // Convert negative to positive
        const totalAvailable = summary.feesCollected + positivePocketMoney + borrowed
        
        setAvailableFunds(totalAvailable)
        setBorrowedCapital(borrowed)
      } catch (error) {
        console.error('Error fetching available funds:', error)
      }
    }
    
    fetchAvailableFunds()
  }, [currentYear])

  // Set selected year to current year on mount
  useEffect(() => {
    if (currentYear && !selectedYearId) {
      setSelectedYearId(currentYear.id)
    }
  }, [currentYear, selectedYearId])

  // Filter expenses by search query
  const filteredExpenses = useMemo(() => {
    if (!expenses) return []
    if (!searchQuery.trim()) return expenses
    
    const query = searchQuery.toLowerCase()
    return expenses.filter(expense => 
      expense.description?.toLowerCase().includes(query) ||
      expense.vendor_name?.toLowerCase().includes(query) ||
      expense.bill_number?.toLowerCase().includes(query) ||
      expense.reference_number?.toLowerCase().includes(query) ||
      expense.category?.toLowerCase().includes(query)
    )
  }, [expenses, searchQuery])

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!filteredExpenses) return { total: 0, count: 0 }
    
    return {
      total: filteredExpenses.reduce((sum, exp) => sum + (exp.amount_paise || 0), 0),
      count: filteredExpenses.length
    }
  }, [filteredExpenses])

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredExpenses, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

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
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">💰</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Expense Management
                  </h1>
                  <p className="mt-1 text-sm text-red-100">
                    Track and manage school expenses • {currentYear.year_label}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowGraphModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                <span className="hidden sm:inline">📊 Expense Graph</span>
                <span className="sm:hidden">📊 Graph</span>
              </button>
              <button
                onClick={() => setShowBorrowModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                <span className="hidden sm:inline">💳 Borrow Capital</span>
                <span className="sm:hidden">💳 Borrow</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-6 py-2 bg-white text-red-600 hover:bg-red-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
              >
                + Add Expense
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-red-100 text-xs sm:text-sm font-medium">Total Available Funds</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{formatINR(availableFunds)}</div>
              <div className="mt-1 text-xs text-red-100">Fees + Pocket Money + Borrowed</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="text-red-100 text-xs sm:text-sm font-medium">Total Expenses</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{formatINR(stats.total)}</div>
              <div className="mt-1 text-xs text-red-100">{stats.count} transactions</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20 sm:col-span-2 lg:col-span-1">
              <div className="text-red-100 text-xs sm:text-sm font-medium">Borrowed Capital</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{formatINR(borrowedCapital)}</div>
              <div className="mt-1 text-xs text-red-100">Outstanding amount</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search expenses by description, vendor, bill number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Filters</h3>
          <button
            onClick={() => {
              setFilters({ category: '', dateFrom: '', dateTo: '', needsApproval: '', isApproved: '' })
              setSearchQuery('')
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Select
            value={selectedYearId || ''}
            onChange={(e) => setSelectedYearId(e.target.value)}
            options={[
              { value: '', label: 'All Years' },
              ...(academicYears || []).map(year => ({
                value: year.id,
                label: year.year_label + (year.is_current ? ' (Current)' : '')
              }))
            ]}
            className="rounded-lg"
          />

          <Select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...EXPENSE_CATEGORIES
            ]}
            className="rounded-lg"
          />

          <Input
            type="date"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="rounded-lg"
          />

          <Input
            type="date"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="rounded-lg"
          />

          <Select
            value={filters.needsApproval}
            onChange={(e) => handleFilterChange('needsApproval', e.target.value)}
            options={[
              { value: '', label: 'All Expenses' },
              { value: 'true', label: 'Needs Approval' },
              { value: 'false', label: 'No Approval Needed' }
            ]}
            className="rounded-lg"
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
            className="rounded-lg"
          />
        </div>
      </Card>

      {/* Expenses List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading expenses...</p>
          </div>
        </div>
      ) : !filteredExpenses?.length ? (
        <EmptyState
          title={searchQuery ? "No matching expenses" : "No Expenses Found"}
          description={searchQuery ? "Try adjusting your search or filters" : "No expenses found for the selected criteria."}
          action={
            <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700 text-white">
              <span className="mr-2">+</span> Add Expense
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedExpenses.map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                navigate={navigate}
                getStatusBadge={getStatusBadge}
                index={index}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} expenses
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                  >
                    ← Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
      
      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Borrow Capital Modal */}
      <BorrowCapitalModal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
      />

      {/* Expense Graph Modal */}
      <ExpenseGraphModal
        isOpen={showGraphModal}
        onClose={() => setShowGraphModal(false)}
        expenses={filteredExpenses}
      />
    </div>
  )
}

// Separate ExpenseRow component for list view
const ExpenseRow = ({ expense, navigate, getStatusBadge, index }) => {
  return (
    <Card 
      className="group p-5 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/expenses/${expense.id}`)}
    >
      <div className="flex items-center gap-6">
        {/* Date Column - Fixed Width */}
        <div className="flex-shrink-0 w-24">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatDate(expense.expense_date)}
          </div>
        </div>

        {/* Description and Details - Flexible */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
              {expense.description}
            </h3>
            {getStatusBadge(expense)}
          </div>
          
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="text-slate-400">📂</span>
              {EXPENSE_CATEGORIES.find(cat => cat.value === expense.category)?.label || expense.category}
            </span>
            {expense.vendor_name && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">👤</span>
                {expense.vendor_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="text-slate-400">💳</span>
              {expense.payment_method.replace('_', ' ')}
            </span>
            {expense.bill_number && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">🧾</span>
                {expense.bill_number}
              </span>
            )}
            {expense.attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                📎 {expense.attachmentCount}
              </span>
            )}
            {expense.is_locked && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                🔒 Locked
              </span>
            )}
          </div>
        </div>

        {/* Amount Column - Fixed Width */}
        <div className="flex-shrink-0 w-32 text-right">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Amount</div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatINR(expense.amount_paise)}
          </div>
        </div>

        {/* Actions Column - Fixed Width */}
        <div className="flex-shrink-0 w-24 flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {expense.needs_approval && expense.is_approved === null && !expense.is_locked && (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/expenses/${expense.id}/approve`)
                }}
                variant="success"
                size="sm"
                className="text-xs px-2"
                title="Approve"
              >
                ✅
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/expenses/${expense.id}/reject`)
                }}
                variant="danger"
                size="sm"
                className="text-xs px-2"
                title="Reject"
              >
                ❌
              </Button>
            </>
          )}
          {!expense.is_locked && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/expenses/${expense.id}/edit`)
              }}
              variant="secondary"
              size="sm"
              className="text-xs px-2"
              title="Edit"
            >
              ✏️
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ExpensesListPage