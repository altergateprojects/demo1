import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { getAlumniList, getLeftSchoolList, getAlumniStats } from '../../api/alumni.api'
import { formatDate } from '../../lib/formatters'

const AlumniPage = () => {
  const [activeTab, setActiveTab] = useState('alumni')
  const [search, setSearch] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['alumni-stats'],
    queryFn: getAlumniStats
  })

  const { data: alumniList, isLoading: alumniLoading } = useQuery({
    queryKey: ['alumni-list', search],
    queryFn: () => getAlumniList({ search })
  })

  const { data: leftSchoolList, isLoading: leftSchoolLoading } = useQuery({
    queryKey: ['left-school-list', search],
    queryFn: () => getLeftSchoolList({ search })
  })

  const tabs = [
    { id: 'alumni', label: 'Alumni (Graduated)', count: stats?.total_alumni || 0, icon: '🎓' },
    { id: 'left-school', label: 'Left School', count: stats?.total_left_school || 0, icon: '🚪' }
  ]

  const isLoading = alumniLoading || leftSchoolLoading

  if (isLoading) return <LoadingScreen />

  const currentList = activeTab === 'alumni' ? alumniList : leftSchoolList

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Alumni Management</h1>
              <p className="mt-1 text-sm text-indigo-100">
                Manage graduated students and those who left school
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-indigo-100 text-sm font-medium">Total Alumni</div>
                <div className="mt-1 text-2xl font-bold text-white">{stats.total_alumni}</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-indigo-100 text-sm font-medium">Left School</div>
                <div className="mt-1 text-2xl font-bold text-white">{stats.total_left_school}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {currentList && currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((record) => (
            <Card key={record.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activeTab === 'alumni'
                    ? 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                    : 'bg-gradient-to-br from-amber-400 to-amber-600'
                }`}>
                  <span className="text-lg font-bold text-white">
                    {record.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {record.full_name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Roll: {record.roll_number}
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">
                        {activeTab === 'alumni' ? 'Graduated:' : 'Left:'}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(activeTab === 'alumni' ? record.graduation_date : record.exit_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">
                        {activeTab === 'alumni' ? 'Final Class:' : 'Last Class:'}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {activeTab === 'alumni' ? record.final_standard_name : record.last_standard_name}
                      </span>
                    </div>
                    {activeTab === 'left-school' && record.exit_reason && (
                      <div className="mt-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs">
                        {record.exit_reason}
                      </div>
                    )}
                    {activeTab === 'alumni' && record.current_occupation && (
                      <div className="mt-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs">
                        {record.current_occupation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {activeTab === 'alumni' ? '🎓' : '🚪'}
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No {activeTab === 'alumni' ? 'Alumni' : 'Left School Students'} Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {search ? 'Try adjusting your search criteria' : 'No records available yet'}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AlumniPage
