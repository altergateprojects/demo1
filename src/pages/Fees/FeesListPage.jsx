import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeeConfigurations, useFeePayments } from '../../hooks/useFees'
import { useCurrentAcademicYear } from '../../hooks/useCommon'
import { formatINR, formatDate } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingScreen from '../../components/ui/LoadingScreen'
import EmptyState from '../../components/ui/EmptyState'

const FeesListPage = () => {
  const { data: currentYear } = useCurrentAcademicYear()
  const [activeTab, setActiveTab] = useState('configurations')
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: ''
  })

  const { data: feeConfigs, isLoading: configsLoading } = useFeeConfigurations(currentYear?.id)
  const { data: feePayments, isLoading: paymentsLoading } = useFeePayments({
    academicYearId: currentYear?.id,
    ...filters
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (!currentYear) return <LoadingScreen />

  const tabs = [
    { id: 'configurations', label: 'Fee Configurations', count: feeConfigs?.length || 0 },
    { id: 'payments', label: 'Fee Payments', count: feePayments?.length || 0 }
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
            Manage fee configurations and track payments for {currentYear.year_label}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            as={Link}
            to="/fees/configurations/add"
            variant="secondary"
          >
            Add Fee Config
          </Button>
          <Button
            as={Link}
            to="/fees/payments/add"
          >
            Record Payment
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
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Fee Configurations Tab */}
      {activeTab === 'configurations' && (
        <div className="space-y-6">
          {configsLoading ? (
            <LoadingScreen />
          ) : !feeConfigs?.length ? (
            <EmptyState
              title="No Fee Configurations"
              description="Set up fee structures for different standards and genders."
              action={
                <Button as={Link} to="/fees/configurations/add">
                  Add Fee Configuration
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {feeConfigs.map((config) => (
                <Card key={config.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                          Standard {config.standard.name}
                        </h3>
                        <Badge variant={config.gender === 'all' ? 'primary' : 'secondary'}>
                          {config.gender === 'all' ? 'All Genders' : config.gender}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                        <span>Annual Fee: {formatINR(config.annual_fee_paise)}</span>
                        <span>Academic Year: {config.academic_year.year_label}</span>
                      </div>
                      {config.notes && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {config.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        as={Link}
                        to={`/fees/configurations/${config.id}/edit`}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fee Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by student name or roll number..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              
              <Select
                value={filters.paymentMethod}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                options={[
                  { value: '', label: 'All Payment Methods' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'cheque', label: 'Cheque' },
                  { value: 'upi', label: 'UPI' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'dd', label: 'Demand Draft' }
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
            </div>
          </Card>

          {paymentsLoading ? (
            <LoadingScreen />
          ) : !feePayments?.length ? (
            <EmptyState
              title="No Fee Payments"
              description="No fee payments found for the selected criteria."
              action={
                <Button as={Link} to="/fees/payments/add">
                  Record Payment
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {feePayments.map((payment) => (
                <Card key={payment.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                          {payment.student.full_name}
                        </h3>
                        <Badge variant="secondary">
                          {payment.student.roll_number}
                        </Badge>
                        <Badge variant="secondary">
                          {payment.student.standard.name}
                        </Badge>
                        {payment.is_reversal && (
                          <Badge variant="danger">Reversed</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                        <span>Amount: {formatINR(payment.amount_paise)}</span>
                        <span>Date: {formatDate(payment.payment_date)}</span>
                        <span>Method: {payment.payment_method.replace('_', ' ')}</span>
                        <span>Received by: {payment.received_by_user.full_name}</span>
                      </div>
                      {payment.reference_number && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Ref: {payment.reference_number}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        as={Link}
                        to={`/fees/payments/${payment.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FeesListPage