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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Fee Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Comprehensive fee management system for {currentYear.year_label}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleAddConfigClick}
            variant="primary"
          >
            Add Fee Configuration
          </Button>
          <Button
            onClick={handleSyncStudentFees}
            variant="secondary"
            loading={syncStudentFeesMutation.isLoading}
            disabled={!currentYear?.id}
          >
            🔄 Sync Student Fees
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Fee Configurations
            </h2>
            <Button
              onClick={handleAddConfigClick}
              variant="primary"
            >
              Add Configuration
            </Button>
          </div>

          {configsLoading ? (
            <Card className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2">Loading configurations...</span>
              </div>
            </Card>
          ) : !feeConfigs?.length ? (
            <div className="space-y-4">
              {/* Debug Information */}
              <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  🔍 No Fee Configurations Found
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  This could be due to:
                </p>
                <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1 mb-4">
                  <li>Database tables not created yet</li>
                  <li>No fee configurations added</li>
                  <li>Database connection issues</li>
                </ul>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleAddConfigClick}
                    variant="primary"
                    size="sm"
                  >
                    Add First Configuration
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="secondary"
                    size="sm"
                  >
                    Refresh Page
                  </Button>
                </div>
              </Card>

              {/* Setup Instructions */}
              <Card className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                  🚀 Quick Setup Guide
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium">Run Database Setup</p>
                      <p className="text-slate-600 dark:text-slate-400">Execute <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">essential-tables-setup.sql</code> in Supabase</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium">Add Fee Configuration</p>
                      <p className="text-slate-600 dark:text-slate-400">Click "Add Configuration" to create your first fee structure</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-medium">Refresh Page</p>
                      <p className="text-slate-600 dark:text-slate-400">Reload the page to see your configurations</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedConfigs).map(([yearLabel, configs]) => (
                <div key={yearLabel}>
                  {/* Year Divider */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-500">
                      {yearLabel}
                    </h3>
                  </div>

                  {/* 3 Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {configs.map((config) => (
                      <Card key={config.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                {config.standard?.name || 'Unknown'}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={config.gender === 'all' ? 'primary' : 'secondary'}>
                                  {config.gender === 'all' ? '👥 All Genders' : config.gender === 'male' ? '👨 Male' : '👩 Female'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Annual Fee</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                              {formatINR(config.annual_fee_paise)}
                            </p>
                          </div>

                          {config.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                              {config.notes}
                            </p>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditClick(config)}
                            className="w-full"
                          >
                            Edit
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
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