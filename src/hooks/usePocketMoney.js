import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getPocketMoneyHistory,
  recordPocketMoneyTransaction,
  getPocketMoneySummary
} from '../api/pocketMoney.api'
import toast from 'react-hot-toast'

/**
 * Hook to get pocket money history for a student
 */
export const usePocketMoneyHistory = (studentId) => {
  return useQuery({
    queryKey: ['pocket-money', studentId, 'history'],
    queryFn: () => getPocketMoneyHistory(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get pocket money summary for a student
 */
export const usePocketMoneySummary = (studentId, academicYearId) => {
  return useQuery({
    queryKey: ['pocket-money', studentId, 'summary', academicYearId],
    queryFn: () => getPocketMoneySummary(studentId, academicYearId),
    enabled: !!studentId && !!academicYearId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to record pocket money transaction
 */
export const useRecordPocketMoneyTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordPocketMoneyTransaction,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['students', data.student_id] })
      queryClient.invalidateQueries({ queryKey: ['pocket-money', data.student_id] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      const transactionType = data.transaction_type === 'credit' ? 'Credit' : 'Debit'
      toast.success(`Pocket money ${transactionType.toLowerCase()} recorded successfully!`)
    },
    onError: (error) => {
      console.error('Error recording pocket money transaction:', error)
      toast.error(error.message || 'Failed to record pocket money transaction')
    }
  })
}