import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getTeacherSalaryHistory,
  createSalaryHistory,
  getTeacherBonuses,
  createTeacherBonus,
  updateTeacherBonus,
  getTeacherSalaryPayments,
  getSalaryPaymentsByMonth,
  createSalaryPayment,
  getTeacherSalarySummary,
  getAllTeachersSalarySummary,
  getSalaryStatistics
} from '../api/teacherSalary.api'
import toast from 'react-hot-toast'

/**
 * Hook to get teacher salary history
 */
export const useTeacherSalaryHistory = (teacherId) => {
  return useQuery({
    queryKey: ['teacher-salary-history', teacherId],
    queryFn: () => getTeacherSalaryHistory(teacherId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to create salary history record
 */
export const useCreateSalaryHistory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSalaryHistory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-history'] })
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Salary updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating salary:', error)
      toast.error(error.message || 'Failed to update salary')
    }
  })
}

/**
 * Hook to get teacher bonuses
 */
export const useTeacherBonuses = (teacherId, academicYearId = null) => {
  return useQuery({
    queryKey: ['teacher-bonuses', teacherId, academicYearId],
    queryFn: () => getTeacherBonuses(teacherId, academicYearId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to create teacher bonus
 */
export const useCreateTeacherBonus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeacherBonus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-bonuses'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`${data.bonus_type} bonus added successfully!`)
    },
    onError: (error) => {
      console.error('Error creating bonus:', error)
      toast.error(error.message || 'Failed to create bonus')
    }
  })
}

/**
 * Hook to update teacher bonus
 */
export const useUpdateTeacherBonus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bonusId, updates }) => updateTeacherBonus(bonusId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-bonuses'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-summary'] })
      toast.success('Bonus updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating bonus:', error)
      toast.error(error.message || 'Failed to update bonus')
    }
  })
}

/**
 * Hook to get teacher salary payments
 */
export const useTeacherSalaryPayments = (teacherId, academicYearId = null) => {
  return useQuery({
    queryKey: ['teacher-salary-payments', teacherId, academicYearId],
    queryFn: () => getTeacherSalaryPayments(teacherId, academicYearId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get all salary payments for a specific month
 */
export const useSalaryPaymentsByMonth = (month) => {
  return useQuery({
    queryKey: ['salary-payments-by-month', month],
    queryFn: () => getSalaryPaymentsByMonth(month),
    enabled: !!month,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to create salary payment
 */
export const useCreateSalaryPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSalaryPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-payments'] })
      queryClient.invalidateQueries({ queryKey: ['salary-payments-by-month'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-summary'] })
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Salary payment recorded successfully!')
    },
    onError: (error) => {
      console.error('Error recording salary payment:', error)
      toast.error(error.message || 'Failed to record salary payment')
    }
  })
}

/**
 * Hook to get teacher salary summary
 */
export const useTeacherSalarySummary = (teacherId) => {
  return useQuery({
    queryKey: ['teacher-salary-summary', teacherId],
    queryFn: () => getTeacherSalarySummary(teacherId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get all teachers salary summary
 */
export const useAllTeachersSalarySummary = () => {
  return useQuery({
    queryKey: ['all-teachers-salary-summary'],
    queryFn: getAllTeachersSalarySummary,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get salary statistics
 */
export const useSalaryStatistics = (academicYearId) => {
  return useQuery({
    queryKey: ['salary-statistics', academicYearId],
    queryFn: () => getSalaryStatistics(academicYearId),
    enabled: !!academicYearId,
    staleTime: 5 * 60 * 1000
  })
}