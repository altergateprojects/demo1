import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '../../hooks/useStudents'
import { formatINR } from '../../lib/formatters'
import PocketMoneyModal from '../../components/shared/PocketMoneyModal'
import TransactionHistoryModal from '../../components/shared/TransactionHistoryModal'
import BulkPocketMoneyDebitModal from '../../components/shared/BulkPocketMoneyDebitModal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Skeleton from '../../components/ui/Skeleton'

const PocketMoneyManagementPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [standardFilter, setStandardFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [balanceFilter, setBalanceFilter] = useState('') // all, positive, negative, zero
  
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [pocketMoneyModalOpen, setPocketMoneyModalOpen] = useState(false)
  const [transactionType, setTransactionType] = useState('credit')
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [bulkDebitModalOpen, setBulkDebitModalOpen] = useState(false)

  const { data: studentsResponse, isLoading } = useStudents({ status: 'active' })
  
  // Extract students array from response
  const students = studentsResponse?.data || []

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStandard = !standardFilter || student.standard_id === standardFilter
    const matchesGender = !genderFilter || student.gender === genderFilter
    
    let matchesBalance = true
    if (balanceFilter === 'positive') {
      matchesBalance = (student.pocket_money_paise || 0) > 0
    } else if (balanceFilter === 'negative') {
      matchesBalance = (student.pocket_money_paise || 0) < 0
    } else if (balanceFilter === 'zero') {
      matchesBalance = (student.pocket_money_paise || 0) === 0
    }
    
    return matchesSearch && matchesStandard && matchesGender && matchesBalance
  })

  // Group students by standard
  const studentsByStandard = filteredStudents.reduce((acc, student) => {
    const standardName = student.standards?.name || 'No Standard'
    const standardId = student.standard_id || 'none'
    const sortOrder = student.standards?.sort_order || 999
    
    if (!acc[standardId]) {
      acc[standardId] = {
        name: standardName,
        sortOrder: sortOrder,
        students: []
      }
    }
    acc[standardId].students.push(student)
    return acc
  }, {})

  // Sort standards by sort_order
  const sortedStandards = Object.entries(studentsByStandard).sort((a, b) => {
    return a[1].sortOrder - b[1].sortOrder
  })

  // Get unique standards for filter
  const standards = [...new Set(students.map(s => ({ id: s.standard_id, name: s.standards?.name })))]
    .filter(s => s.id)
    .sort((a, b) => a.name?.localeCompare(b.name))

  const handleCredit = (student) => {
    setSelectedStudent(student)
    setTransactionType('credit')
    setPocketMoneyModalOpen(true)
  }

  const handleDebit = (student) => {
    setSelectedStudent(student)
    setTransactionType('debit')
    setPocketMoneyModalOpen(true)
  }

  const handleViewHistory = (student) => {
    setSelectedStudent(student)
    setHistoryModalOpen(true)
  }

  // Calculate summary stats
  const totalBalance = filteredStudents.reduce((sum, s) => sum + (s.pocket_money_paise || 0), 0)
  const positiveBalances = filteredStudents.filter(s => (s.pocket_money_paise || 0) > 0).length
  const negativeBalances = filteredStudents.filter(s => (s.pocket_money_paise || 0) < 0).length
  const zeroBalances = filteredStudents.filter(s => (s.pocket_money_paise || 0) === 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pocket Money Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage student pocket money credits, debits, and view transaction history
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/students')}
          >
            Back to Students
          </Button>
          <Button
            onClick={() => setBulkDebitModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Bulk Debit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Balance</div>
          <div className={`text-2xl font-bold mt-1 ${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatINR(totalBalance)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Positive Balances</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {positiveBalances}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Negative Balances</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {negativeBalances}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Zero Balances</div>
          <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">
            {zeroBalances}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            placeholder="All Standards"
            value={standardFilter}
            onChange={(e) => setStandardFilter(e.target.value)}
            options={standards.map(s => ({ value: s.id, label: s.name }))}
          />
          <Select
            placeholder="All Genders"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <Select
            placeholder="All Balances"
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            options={[
              { value: 'positive', label: 'Positive Balance' },
              { value: 'negative', label: 'Negative Balance (Overdraft)' },
              { value: 'zero', label: 'Zero Balance' }
            ]}
          />
        </div>
      </div>

      {/* Students Grouped by Standard */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-slate-300 dark:border-slate-700 p-4">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="border border-slate-300 dark:border-slate-700 p-8 text-center bg-white dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            No students found matching your filters
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedStandards.map(([standardId, standardData]) => (
            <div key={standardId} className="border-2 border-slate-300 dark:border-slate-700">
              {/* Standard Header */}
              <div className="bg-primary-600 px-4 py-3 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">
                  {standardData.name}
                </h2>
                <span className="bg-white text-primary-600 px-3 py-1 text-sm font-semibold">
                  {standardData.students.length} Students
                </span>
              </div>

              {/* Students Grid */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {standardData.students.map(student => (
                    <div key={student.id} className="border border-slate-300 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                      {/* Student Info */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {student.full_name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Roll: {student.roll_number}
                        </p>
                      </div>

                      {/* Balance */}
                      <div className="mb-3 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Balance
                        </div>
                        <div className={`text-lg font-bold ${
                          (student.pocket_money_paise || 0) > 0 
                            ? 'text-green-600'
                            : (student.pocket_money_paise || 0) < 0
                            ? 'text-red-600'
                            : 'text-slate-600'
                        }`}>
                          {formatINR(student.pocket_money_paise || 0)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCredit(student)}
                            className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            + Credit
                          </button>
                          <button
                            onClick={() => handleDebit(student)}
                            className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            - Debit
                          </button>
                        </div>
                        <button
                          onClick={() => handleViewHistory(student)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          History
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedStudent && (
        <>
          <PocketMoneyModal
            isOpen={pocketMoneyModalOpen}
            onClose={() => {
              setPocketMoneyModalOpen(false)
              setSelectedStudent(null)
            }}
            student={selectedStudent}
            type={transactionType}
          />
          <TransactionHistoryModal
            isOpen={historyModalOpen}
            onClose={() => {
              setHistoryModalOpen(false)
              setSelectedStudent(null)
            }}
            student={selectedStudent}
            type="pocket_money"
          />
        </>
      )}

      <BulkPocketMoneyDebitModal
        isOpen={bulkDebitModalOpen}
        onClose={() => setBulkDebitModalOpen(false)}
        students={students}
      />
    </div>
  )
}

export default PocketMoneyManagementPage
