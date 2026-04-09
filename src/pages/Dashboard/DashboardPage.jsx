import React from 'react'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import RoleGate from '../../components/shared/RoleGate'
import { useDashboardSummary, useStandardFeeSummary, useRecentActivity } from '../../hooks/useDashboard'
import { useCurrentAcademicYear } from '../../hooks/useCommon'
import { formatINR, formatRelativeTime } from '../../lib/formatters'
import Skeleton from '../../components/ui/Skeleton'
import Card from '../../components/ui/Card'

const DashboardPage = () => {
  const { profile } = useAuthStore()
  const { currentAcademicYearId } = useUIStore()
  
  // Get current academic year if not set in UI store
  const { data: currentYear } = useCurrentAcademicYear()
  const academicYearId = currentAcademicYearId || currentYear?.id

  // Fetch dashboard data
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary(academicYearId)
  const { data: standardSummary, isLoading: standardLoading } = useStandardFeeSummary(academicYearId)
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5)

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-blue-100">
                    Welcome back, {profile?.full_name}! Here's an overview of your school's financial status.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {summaryLoading ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Skeleton.Card />
              <Skeleton.Card />
              <Skeleton.Card />
              <Skeleton.Card />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-blue-100 text-xs sm:text-sm font-medium">Total Students</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {summary?.studentsCount?.toLocaleString('en-IN') || '0'}
                </div>
                <div className="mt-1 text-xs text-blue-100">Enrolled students</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-blue-100 text-xs sm:text-sm font-medium">Active Teachers</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {summary?.teachersCount?.toLocaleString('en-IN') || '0'}
                </div>
                <div className="mt-1 text-xs text-blue-100">Teaching staff</div>
              </div>
              <RoleGate allow={['admin', 'finance']}>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                  <div className="text-red-500 text-xs sm:text-sm font-medium">Pending Fees</div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-red-400">
                    {formatINR(summary?.pendingFeesSum || 0)}
                  </div>
                  <div className="mt-1 text-xs text-red-500">Current year</div>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                  <div className="text-red-500 text-xs sm:text-sm font-medium">Total Pending</div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-red-400">
                    {formatINR(summary?.totalOutstanding || 0)}
                  </div>
                  <div className="mt-1 text-xs text-red-500">All years + dues</div>
                </div>
              </RoleGate>
            </div>
          )}
        </div>
      </div>

      {/* Finance Overview - Admin/Finance Only */}
      <RoleGate allow={['admin', 'finance']}>
        {summaryLoading ? (
          <Skeleton.Card />
        ) : (
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Card.Header>
              <Card.Title>Financial Overview (Current Academic Year)</Card.Title>
            </Card.Header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Total Fees Collected</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatINR(summary?.feesCollected || 0)}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">This academic year</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Pending Pocket Money</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {formatINR(summary?.totalNegativePocketMoney || 0)}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {summary?.negativePocketMoneyCount || 0} student{(summary?.negativePocketMoneyCount || 0) !== 1 ? 's' : ''} with negative balance
                </p>
              </div>
            </div>
          </Card>
        )}
      </RoleGate>

      {/* Standard-wise Summary - Admin/Finance Only */}
      <RoleGate allow={['admin', 'finance']}>
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <Card.Header>
            <Card.Title>Standard-wise Fee Summary</Card.Title>
          </Card.Header>
          {standardLoading ? (
            <Skeleton.Table rows={5} columns={6} />
          ) : standardSummary?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Standard
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Annual Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Collected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      % Collected
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {standardSummary.map((standard) => (
                    <tr key={standard.standardName} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                        {standard.standardName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {standard.activeStudents}
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          ({standard.maleCount}M, {standard.femaleCount}F)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {formatINR(standard.totalAnnualFee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                        {formatINR(standard.totalPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium">
                        {formatINR(standard.totalPending)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${standard.totalAnnualFee > 0 
                                  ? Math.round((standard.totalPaid / standard.totalAnnualFee) * 100)
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-slate-900 dark:text-slate-100 font-medium min-w-[3rem] text-right">
                            {standard.totalAnnualFee > 0 
                              ? Math.round((standard.totalPaid / standard.totalAnnualFee) * 100)
                              : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-slate-600 dark:text-slate-400">No standard data available</p>
            </div>
          )}
        </Card>
      </RoleGate>

      {/* Recent Activity */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <Card.Header>
          <Card.Title>Recent Activity</Card.Title>
        </Card.Header>
        {activityLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Skeleton variant="circular" width="32px" height="32px" />
                <div className="flex-1">
                  <Skeleton variant="text" className="w-3/4 mb-1" />
                  <Skeleton variant="text" className="w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity?.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.action_type === 'CREATE' 
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : activity.action_type === 'UPDATE'
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : activity.action_type === 'DELETE'
                      ? 'bg-red-100 dark:bg-red-900/20'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      activity.action_type === 'CREATE' 
                        ? 'text-green-600 dark:text-green-400'
                        : activity.action_type === 'UPDATE'
                        ? 'text-blue-600 dark:text-blue-400'
                        : activity.action_type === 'DELETE'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {activity.action_type === 'CREATE' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      )}
                      {activity.action_type === 'UPDATE' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      )}
                      {activity.action_type === 'DELETE' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      )}
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {formatRelativeTime(activity.created_at)} by {activity.performer_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
        </Card.Header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="group p-4 text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add Student</span>
            </div>
          </button>

          <RoleGate allow={['admin', 'finance']}>
            <button className="group p-4 text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Record Payment</span>
              </div>
            </button>

            <button className="group p-4 text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add Expense</span>
              </div>
            </button>

            <button className="group p-4 text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Generate Report</span>
              </div>
            </button>
          </RoleGate>
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage