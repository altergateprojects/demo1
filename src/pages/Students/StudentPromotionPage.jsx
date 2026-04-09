import { useState, useEffect, useMemo } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingScreen from '../../components/ui/LoadingScreen'
import PromotionModal from '../../components/shared/PromotionModal'
import BulkPromotionModal from '../../components/shared/BulkPromotionModal'
import { useStudentsForPromotion } from '../../hooks/useStudentPromotion'
import { useAcademicYears, useStandards } from '../../hooks/useCommon'
import { formatINR } from '../../lib/formatters'

const StudentPromotionPage = () => {
  // State
  const [selectedStudents, setSelectedStudents] = useState(new Set())
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [expandedStandard, setExpandedStandard] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [isBulkPromotionModalOpen, setIsBulkPromotionModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Fetch data
  const { data: academicYears, isLoading: yearsLoading } = useAcademicYears()
  const { data: standards, isLoading: standardsLoading } = useStandards()
  
  // Get current academic year
  const currentYear = useMemo(() => 
    academicYears?.find(y => y.is_current),
    [academicYears]
  )

  // Set default academic year
  useEffect(() => {
    if (currentYear && !selectedAcademicYear) {
      setSelectedAcademicYear(currentYear.id)
    }
  }, [currentYear, selectedAcademicYear])

  // Fetch students for promotion
  const { data: students, isLoading: studentsLoading } = useStudentsForPromotion(
    selectedAcademicYear || currentYear?.id,
    null // Fetch all standards
  )

  // Group students by standard
  const studentsByStandard = useMemo(() => {
    if (!students || !standards) return []
    
    const grouped = standards.map(standard => {
      const standardStudents = students.filter(s => s.standard_id === standard.id)
      const maleCount = standardStudents.filter(s => s.gender === 'male').length
      const femaleCount = standardStudents.filter(s => s.gender === 'female').length
      const totalPending = standardStudents.reduce((sum, s) => sum + (s.total_pending_dues_paise || 0), 0)
      const eligibleCount = standardStudents.filter(s => s.promotion_eligible).length
      
      return {
        standard,
        students: standardStudents,
        count: standardStudents.length,
        maleCount,
        femaleCount,
        totalPending,
        eligibleCount
      }
    }).filter(group => group.count > 0) // Only show standards with students
    
    return grouped
  }, [students, standards])

  // Filter students in expanded standard by search
  const filteredStudentsInStandard = useMemo(() => {
    if (!expandedStandard) return []
    
    const standardGroup = studentsByStandard.find(g => g.standard.id === expandedStandard)
    if (!standardGroup) return []
    
    if (!searchQuery) return standardGroup.students
    
    const query = searchQuery.toLowerCase()
    return standardGroup.students.filter(student =>
      student.full_name?.toLowerCase().includes(query) ||
      student.roll_number?.toLowerCase().includes(query)
    )
  }, [expandedStandard, studentsByStandard, searchQuery])

  // Handlers
  const handleStandardClick = (standardId) => {
    if (expandedStandard === standardId) {
      setExpandedStandard(null)
      setSelectedStudents(new Set())
      setSearchQuery('')
    } else {
      setExpandedStandard(standardId)
      setSelectedStudents(new Set())
      setSearchQuery('')
    }
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudentsInStandard.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredStudentsInStandard.map(s => s.student_id)))
    }
  }

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handlePromoteStudent = (student) => {
    setSelectedStudent(student)
    setIsPromotionModalOpen(true)
  }

  const handleBulkPromotion = () => {
    setIsBulkPromotionModalOpen(true)
  }

  const handlePromotionSuccess = () => {
    setSelectedStudents(new Set())
    setIsPromotionModalOpen(false)
    setIsBulkPromotionModalOpen(false)
  }

  // Get selected students data
  const selectedStudentsData = useMemo(() => {
    return filteredStudentsInStandard.filter(s => selectedStudents.has(s.student_id))
  }, [filteredStudentsInStandard, selectedStudents])

  if (yearsLoading || standardsLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Student Promotion
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Promote students to next academic year with complete financial tracking
          </p>
        </div>
      </div>

      {/* Academic Year Filter */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => {
                setSelectedAcademicYear(e.target.value)
                setExpandedStandard(null)
                setSelectedStudents(new Set())
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {academicYears?.map(year => (
                <option key={year.id} value={year.id}>
                  {year.year_label} {year.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          {expandedStandard && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Search Students
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Bulk Action Toolbar */}
      {selectedStudents.size > 0 && (
        <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudents(new Set())}
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={handleBulkPromotion}
              >
                Bulk Promote ({selectedStudents.size})
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Standard-wise Cards */}
      {studentsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Loading students...</p>
        </div>
      ) : studentsByStandard.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">
              No students available for promotion in the selected academic year.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentsByStandard.map(({ standard, count, maleCount, femaleCount, totalPending, eligibleCount }) => (
            <Card
              key={standard.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                expandedStandard === standard.id 
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : ''
              }`}
              onClick={() => handleStandardClick(standard.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {standard.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{count}</span> students
                      <span className="text-xs ml-2">({maleCount}M, {femaleCount}F)</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-green-600 dark:text-green-400">{eligibleCount}</span> eligible
                    </p>
                    {totalPending > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {formatINR(totalPending)} pending
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    expandedStandard === standard.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <svg 
                      className={`w-5 h-5 transition-transform ${expandedStandard === standard.id ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Expanded Standard - Students Table */}
      {expandedStandard && (
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>
                {studentsByStandard.find(g => g.standard.id === expandedStandard)?.standard.name} - Students List
              </Card.Title>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setExpandedStandard(null)
                  setSelectedStudents(new Set())
                  setSearchQuery('')
                }}
              >
                Close
              </Button>
            </div>
          </Card.Header>
          
          <div className="overflow-x-auto">
            {filteredStudentsInStandard.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery ? 'No students found matching your search.' : 'No students in this standard.'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === filteredStudentsInStandard.length && filteredStudentsInStandard.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Fee Due
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Pocket Money
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Pending
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredStudentsInStandard.map((student) => (
                    <tr 
                      key={student.student_id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        selectedStudents.has(student.student_id) ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.student_id)}
                          onChange={() => handleSelectStudent(student.student_id)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {student.roll_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                        {formatINR(student.fee_due_paise)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={student.pocket_money_paise < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                          {student.pocket_money_paise < 0 ? '-' : ''}
                          {formatINR(Math.abs(student.pocket_money_paise))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span className={student.total_pending_dues_paise > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}>
                          {formatINR(student.total_pending_dues_paise)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {student.promotion_eligible ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Eligible
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            title={student.promotion_hold_reason}
                          >
                            On Hold
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePromoteStudent(student)}
                          disabled={!student.promotion_eligible}
                        >
                          Promote
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer */}
          {filteredStudentsInStandard.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredStudentsInStandard.length} student{filteredStudentsInStandard.length !== 1 ? 's' : ''}
                {searchQuery && ' (filtered)'}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      {isPromotionModalOpen && selectedStudent && (
        <PromotionModal
          student={selectedStudent}
          isOpen={isPromotionModalOpen}
          onClose={() => {
            setIsPromotionModalOpen(false)
            setSelectedStudent(null)
          }}
          onSuccess={handlePromotionSuccess}
        />
      )}

      {isBulkPromotionModalOpen && (
        <BulkPromotionModal
          students={selectedStudentsData}
          isOpen={isBulkPromotionModalOpen}
          onClose={() => setIsBulkPromotionModalOpen(false)}
          onSuccess={handlePromotionSuccess}
        />
      )}
    </div>
  )
}

export default StudentPromotionPage
