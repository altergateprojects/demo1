import { useState, useMemo } from 'react'
import { useFeeConfigurations, useFeeStatistics, useSyncStudentFees } from '../../hooks/useFees'
import { useCurrentAcademicYear } from '../../hooks/useCommon'
import { formatINR } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'
import AddFeeConfigModal from '../../components/shared/AddFeeConfigModal'
import EditFeeConfigModal from '../../components/shared/EditFeeConfigModal'

const FeesListPageNew = () => {
  const { data: currentYear } = useCurrentAcademicYear()
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddConfigModal, setShowAddConfigModal] = useState(false)
  const [showEditConfigModal, setShowEditConfigModal] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState(null)

  const { data: feeConfigs, isLoading: configsLoading } = useFeeConfigurations()
  const { data: feeStats, isLoading: statsLoading } = useFeeStatistics(currentYear?.id)
  const syncStudentFeesMutation = useSyncStudentFees()

  const handleAddConfigClick = () => {
    setShowAddConfigModal(true)
  }

  const handleModalClose = () => {
    setShowAddConfigModal(false)
    setShowEditConfigModal(false)
    setSelectedConfig(null)
  }

  const handleEditClick = (config) => {
    setSelectedConfig(config)
    setShowEditConfigModal(true)
  }

  const handleSyncStudentFees = () => {
    if (currentYear?.id) {
      syncStudentFeesMutation.mutate(currentYear.id)
    }
  }

  // Group configs by academic year and sort by standard - MEMOIZED for performance
  const groupedConfigs = useMemo(() => {
    if (!feeConfigs) return {}
    
    const grouped = feeConfigs.reduce((acc, config) => {
      const yearLabel = config.academic_year?.year_label || 'Unknown'
      if (!acc[yearLabel]) {
        acc[yearLabel] = []
      }
      acc[yearLabel].push(config)
      return acc
    }, {})

    // Sort each year's configs by standard sort_order
    Object.keys(grouped).forEach(year => {
      grouped[year].sort((a, b) => {
        const orderA = a.standard?.sort_order || 0
        const orderB = b.standard?.sort_order || 0
        return orderA - orderB
      })
    })

    return grouped
  }, [feeConfigs])

  if (!currentYear) return <LoadingScreen />

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'configurations', label: 'Fee Configurations', count: feeConfigs?.length || 0, icon: '⚙️' },
    { id: 'reports', label: 'Reports', icon: '📈' }
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700 p-6 sm:p-8 shadow-xl">
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
                    Fee Management
                  </h1>
                  <p className="mt-1 text-sm text-cyan-100">
                    Comprehensive fee management system for {currentYear.year_label}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleSyncStudentFees}
                disabled={!currentYear?.id || syncStudentFeesMutation.isLoading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
              >
                🔄 Sync Fees
              </button>
              <button
                onClick={handleAddConfigClick}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-6 py-2 bg-white text-cyan-600 hover:bg-cyan-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
              >
                + Add Configuration
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {feeStats && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-cyan-100 text-xs sm:text-sm font-medium">Total Collected</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {statsLoading ? '...' : formatINR(feeStats?.total_collected_paise || 0)}
                </div>
                <div className="mt-1 text-xs text-cyan-100">Fee collection</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-cyan-100 text-xs sm:text-sm font-medium">Paid Students</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {statsLoading ? '...' : (feeStats?.students_paid || 0)}
                </div>
                <div className="mt-1 text-xs text-cyan-100">Fully paid</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-cyan-100 text-xs sm:text-sm font-medium">Pending</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {statsLoading ? '...' : formatINR(feeStats?.total_pending_paise || 0)}
                </div>
                <div className="mt-1 text-xs text-cyan-100">Outstanding</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-cyan-100 text-xs sm:text-sm font-medium">Collection Rate</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {statsLoading ? '...' : `${feeStats?.collection_percentage || 0}%`}
                </div>
                <div className="mt-1 text-xs text-cyan-100">Success rate</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Pill-style Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Collected</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {statsLoading ? '...' : formatINR(feeStats?.total_collected_paise || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Paid Students</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {statsLoading ? '...' : (feeStats?.students_paid || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-lg">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {statsLoading ? '...' : formatINR(feeStats?.total_pending_paise || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Collection Rate</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {statsLoading ? '...' : `${feeStats?.collection_percentage || 0}%`}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAddConfigClick}
                variant="primary"
              >
                ⚙️ Add Fee Configuration
              </Button>
              <Button
                onClick={() => setActiveTab('configurations')}
                variant="secondary"
              >
                📋 View Configurations
              </Button>
              <Button
                onClick={handleSyncStudentFees}
                variant="secondary"
                loading={syncStudentFeesMutation.isLoading}
              >
                🔄 Sync Student Fees
              </Button>
            </div>
          </Card>

          {/* Fee Sync Info */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Automatic Fee Updates
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  When you add or modify fee configurations, student pending fees are automatically updated. 
                  Use the "Sync Student Fees" button if you need to manually refresh all student fee amounts.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Fee Configurations Tab */}
      {activeTab === 'configurations' && (
        <div className="space-y-6">
          {configsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-200 border-t-cyan-600"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400">Loading configurations...</p>
              </div>
            </div>
          ) : !feeConfigs?.length ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-6xl mb-4">⚙️</div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No Fee Configurations Found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Get started by adding your first fee configuration.
                </p>
                <Button
                  onClick={handleAddConfigClick}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  + Add First Configuration
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedConfigs).map(([yearLabel, configs]) => (
                <div key={yearLabel}>
                  {/* Year Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
                      {yearLabel}
                    </h3>
                  </div>

                  {/* Table */}
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Standard
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Gender
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Annual Fee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Notes
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                          {configs.map((config) => (
                            <tr key={config.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                                      <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                                        {config.standard?.name?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {config.standard?.name || 'Unknown'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={config.gender === 'all' ? 'primary' : 'secondary'}>
                                  {config.gender === 'all' ? 'All' : config.gender === 'male' ? 'Male' : 'Female'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {formatINR(config.annual_fee_paise)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                  {config.notes || '—'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEditClick(config)}
                                  className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
              Fee Collection Reports
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Essential collection reports and analytics for the current academic year.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="secondary" className="justify-start">
                📊 Collection Summary Report
              </Button>
              <Button variant="secondary" className="justify-start">
                💰 Monthly Collection Trends
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <AddFeeConfigModal
        isOpen={showAddConfigModal}
        onClose={handleModalClose}
      />
      
      <EditFeeConfigModal
        isOpen={showEditConfigModal}
        onClose={handleModalClose}
        config={selectedConfig}
      />
    </div>
  )
}

export default FeesListPageNew