import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getStudentTotalDues,
  getStudentDues,
  getStudentPromotions,
  getStudentExitDues,
  promoteStudentWithDues,
  recordStudentExitWithDues,
  clearStudentDues,
  createStudentDue,
  updateStudentDue,
  getDuesSummaryStats,
  addDuePayment,
  getDuePaymentHistory,
  getStudentPaymentSummary
} from '../api/studentDues.api'
import toast from 'react-hot-toast'

// Get student's total dues
export const useStudentTotalDues = (studentId) => {
  return useQuery({
    queryKey: ['student-total-dues', studentId],
    queryFn: () => getStudentTotalDues(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000
  })
}

// Get student dues with filters
export const useStudentDues = (filters = {}) => {
  return useQuery({
    queryKey: ['student-dues', filters],
    queryFn: () => getStudentDues(filters),
    staleTime: 1 * 60 * 1000
  })
}

// Get student promotions
export const useStudentPromotions = (filters = {}) => {
  return useQuery({
    queryKey: ['student-promotions', filters],
    queryFn: () => getStudentPromotions(filters),
    staleTime: 5 * 60 * 1000
  })
}

// Get student exit dues
export const useStudentExitDues = (filters = {}) => {
  return useQuery({
    queryKey: ['student-exit-dues', filters],
    queryFn: () => getStudentExitDues(filters),
    staleTime: 2 * 60 * 1000
  })
}

// Get dues summary statistics
export const useDuesSummaryStats = (academicYearId = null) => {
  return useQuery({
    queryKey: ['dues-summary-stats', academicYearId],
    queryFn: () => getDuesSummaryStats(academicYearId),
    staleTime: 2 * 60 * 1000
  })
}

// Promote student with dues
export const usePromoteStudentWithDues = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: promoteStudentWithDues,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-dues'] })
      queryClient.invalidateQueries({ queryKey: ['student-promotions'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student-total-dues'] })
      toast.success('Student promoted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to promote student')
    }
  })
}

// Record student exit with dues
export const useRecordStudentExitWithDues = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordStudentExitWithDues,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-exit-dues'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student-total-dues'] })
      toast.success('Student exit recorded successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record student exit')
    }
  })
}

// Clear student dues
export const useClearStudentDues = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dueIds, paymentReference }) => clearStudentDues(dueIds, paymentReference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-dues'] })
      queryClient.invalidateQueries({ queryKey: ['student-total-dues'] })
      queryClient.invalidateQueries({ queryKey: ['dues-summary-stats'] })
      toast.success('Dues cleared successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to clear dues')
    }
  })
}

// Create manual due entry
export const useCreateStudentDue = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createStudentDue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-dues'] })
      queryClient.invalidateQueries({ queryKey: ['student-total-dues'] })
      queryClient.invalidateQueries({ queryKey: ['dues-summary-stats'] })
      toast.success('Due added successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add due')
    }
  })
}

// Update student due
export const useUpdateStudentDue = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateStudentDue(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-dues'] })
      queryClient.invalidateQueries({ queryKey: ['student-total-dues'] })
      queryClient.invalidateQueries({ queryKey: ['dues-summary-stats'] })
      toast.success('Due updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update due')
    }
  })
}

// Add payment to a due
export const useAddDuePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentDueId, paymentData }) => addDuePayment(studentDueId, paymentData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-dues'] })
      queryClient.invalidateQueries({ queryKey: ['student-total-dues'] })
      queryClient.invalidateQueries({ queryKey: ['dues-summary-stats'] })
      queryClient.invalidateQueries({ queryKey: ['due-payment-history'] })
      queryClient.invalidateQueries({ queryKey: ['student-payment-summary'] })
      
      if (data.is_fully_paid) {
        toast.success('Payment recorded! Due is now fully paid and moved to cleared section.')
      } else {
        toast.success(`Payment recorded! Remaining: ₹${(data.remaining / 100).toFixed(2)}`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record payment')
    }
  })
}

// Get payment history for a due
export const useDuePaymentHistory = (studentDueId) => {
  return useQuery({
    queryKey: ['due-payment-history', studentDueId],
    queryFn: () => getDuePaymentHistory(studentDueId),
    enabled: !!studentDueId,
    staleTime: 1 * 60 * 1000
  })
}

// Get payment summary for a student
export const useStudentPaymentSummary = (studentId) => {
  return useQuery({
    queryKey: ['student-payment-summary', studentId],
    queryFn: () => getStudentPaymentSummary(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000
  })
}
