import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getStudentFeeHistory,
  recordFeePayment
} from '../api/students.api'
import toast from 'react-hot-toast'

/**
 * Hook to get students with pagination and filters
 */
export const useStudents = (filters = {}) => {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => getStudents(filters),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get student by ID
 */
export const useStudent = (id) => {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => getStudentById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get student fee history
 */
export const useStudentFeeHistory = (studentId) => {
  return useQuery({
    queryKey: ['students', studentId, 'fee-history'],
    queryFn: () => getStudentFeeHistory(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to create student
 */
export const useCreateStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createStudent,
    onSuccess: (data) => {
      // Invalidate students list
      queryClient.invalidateQueries({ queryKey: ['students'] })
      
      // Add to cache
      queryClient.setQueryData(['students', data.id], data)
      
      toast.success('Student created successfully!')
    },
    onError: (error) => {
      console.error('Error creating student:', error)
      toast.error(error.message || 'Failed to create student')
    }
  })
}

/**
 * Hook to update student
 */
export const useUpdateStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateStudent(id, updates),
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['students', data.id], data)
      
      // Invalidate students list
      queryClient.invalidateQueries({ queryKey: ['students'] })
      
      toast.success('Student updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating student:', error)
      toast.error(error.message || 'Failed to update student')
    }
  })
}

/**
 * Hook to delete student
 */
export const useDeleteStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }) => deleteStudent(id, reason),
    onSuccess: (data) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['students', data.id] })
      
      // Invalidate students list
      queryClient.invalidateQueries({ queryKey: ['students'] })
      
      toast.success('Student deleted successfully!')
    },
    onError: (error) => {
      console.error('Error deleting student:', error)
      toast.error(error.message || 'Failed to delete student')
    }
  })
}

/**
 * Hook to record fee payment
 */
export const useRecordFeePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordFeePayment,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['students', data.student_id] })
      queryClient.invalidateQueries({ queryKey: ['students', data.student_id, 'fee-history'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success(`Fee payment recorded! Receipt: ${data.receipt_number}`)
    },
    onError: (error) => {
      console.error('Error recording fee payment:', error)
      toast.error(error.message || 'Failed to record fee payment')
    }
  })
}

/**
 * Hook to get students summary stats
 */
export const useStudentsStats = (academicYearId) => {
  return useQuery({
    queryKey: ['students', 'stats', academicYearId],
    queryFn: async () => {
      const { data } = await getStudents({ 
        academicYearId, 
        limit: 1000 // Get all for stats
      })
      
      const stats = {
        total: data.length,
        active: data.filter(s => s.status === 'active').length,
        inactive: data.filter(s => s.status === 'inactive').length,
        suspended: data.filter(s => s.status === 'suspended').length,
        withdrawn: data.filter(s => s.status === 'withdrawn').length,
        male: data.filter(s => s.gender === 'male').length,
        female: data.filter(s => s.gender === 'female').length,
        rte: data.filter(s => s.is_rte).length,
        totalFees: data.reduce((sum, s) => sum + (s.annual_fee_paise || 0), 0),
        totalPaid: data.reduce((sum, s) => sum + (s.fee_paid_paise || 0), 0),
        totalPending: data.reduce((sum, s) => sum + (s.total_pending_paise || 0), 0),
        previousYearsPending: data.reduce((sum, s) => sum + (s.previous_years_pending_paise || 0), 0),
        currentYearPending: data.reduce((sum, s) => sum + (s.current_year_pending_paise || 0), 0),
        totalPocketMoney: data.reduce((sum, s) => sum + (s.pocket_money_paise || 0), 0),
        negativePocketMoney: data.filter(s => (s.pocket_money_paise || 0) < 0).length,
        positivePocketMoney: data.filter(s => (s.pocket_money_paise || 0) > 0).length,
        zeroPocketMoney: data.filter(s => (s.pocket_money_paise || 0) === 0).length
      }
      
      return stats
    },
    enabled: !!academicYearId,
    staleTime: 5 * 60 * 1000,
  })
}
/**
 * Hook to get complete student data for PDF export
 */
export const useCompleteStudentData = (studentId) => {
  return useQuery({
    queryKey: ['students', studentId, 'complete'],
    queryFn: () => getCompleteStudentData(studentId),
    enabled: !!studentId,
    staleTime: 0, // Always fetch fresh data for deletion
  })
}

/**
 * Hook to delete student completely
 */
export const useDeleteStudentCompletely = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, reason }) => deleteStudentCompletely(studentId, reason),
    onSuccess: (data) => {
      // Invalidate all student-related queries
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      // Remove specific student from cache
      queryClient.removeQueries({ queryKey: ['students', data.student_id] })
      
      toast.success('Student deleted successfully!')
    },
    onError: (error) => {
      console.error('Error deleting student:', error)
      toast.error(error.message || 'Failed to delete student')
    }
  })
}