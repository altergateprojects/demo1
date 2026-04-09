import React, { useMemo } from 'react'
import Modal from '../ui/Modal'
import { formatINR } from '../../lib/formatters'

const ExpenseGraphModal = ({ isOpen, onClose, expenses }) => {
  // Calculate month-wise expense data
  const monthlyData = useMemo(() => {
    if (!expenses || expenses.length === 0) return []

    // Group expenses by month
    const grouped = expenses.reduce((acc, expense) => {
      const date = new Date(expense.expense_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthLabel,
          total: 0,
          count: 0,
          sortKey: monthKey
        }
      }

      acc[monthKey].total += expense.amount_paise
      acc[monthKey].count += 1

      return acc
    }, {})

    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }, [expenses])

  // Find max value for scaling
  const maxAmount = useMemo(() => {
    if (monthlyData.length === 0) return 0
    return Math.max(...monthlyData.map(d => d.total))
  }, [monthlyData])

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalAmount: monthlyData.reduce((sum, d) => sum + d.total, 0),
      totalCount: monthlyData.reduce((sum, d) => sum + d.count, 0),
      avgPerMonth: monthlyData.length > 0 
        ? monthlyData.reduce((sum, d) => sum + d.total, 0) / monthlyData.length 
        : 0
    }
  }, [monthlyData])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📊 Monthly Expense Analysis"
      size="xl"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">Total Expenses</div>
            <div className="mt-1 text-2xl font-bold text-red-900 dark:text-red-100">
              {formatINR(totals.totalAmount)}
            </div>
            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
              {totals.totalCount} transactions
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Months Tracked</div>
            <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
              {monthlyData.length}
            </div>
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              months with expenses
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Avg Per Month</div>
            <div className="mt-1 text-2xl font-bold text-green-900 dark:text-green-100">
              {formatINR(totals.avgPerMonth)}
            </div>
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              average spending
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        {monthlyData.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg">No expense data available</p>
            <p className="text-sm mt-2">Add some expenses to see the monthly analysis</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Month-wise Breakdown
            </h3>
            
            <div className="space-y-3">
              {monthlyData.map((data, index) => {
                const percentage = maxAmount > 0 ? (data.total / maxAmount) * 100 : 0
                
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {data.month}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatINR(data.total)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          ({data.count} {data.count === 1 ? 'expense' : 'expenses'})
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative h-10 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg transition-all duration-500 ease-out group-hover:from-red-600 group-hover:to-red-700"
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                          {percentage > 20 && (
                            <span className="text-xs font-semibold text-white">
                              {percentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Insights */}
        {monthlyData.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              💡 Insights
            </h4>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {(() => {
                const highest = monthlyData.reduce((max, d) => d.total > max.total ? d : max, monthlyData[0])
                const lowest = monthlyData.reduce((min, d) => d.total < min.total ? d : min, monthlyData[0])
                
                return (
                  <>
                    <p>
                      • Highest spending was in <span className="font-semibold text-slate-900 dark:text-slate-100">{highest.month}</span> with {formatINR(highest.total)}
                    </p>
                    <p>
                      • Lowest spending was in <span className="font-semibold text-slate-900 dark:text-slate-100">{lowest.month}</span> with {formatINR(lowest.total)}
                    </p>
                    {monthlyData.length >= 2 && (
                      <p>
                        • Variance between highest and lowest: {formatINR(highest.total - lowest.total)}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ExpenseGraphModal
