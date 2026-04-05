import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseStatistics
} from '../api/expenses.api'

// Expenses
export const useExpenses = (filters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => getExpenses(filters)
  })
}

export const useExpense = (id) => {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => getExpense(id),
    enabled: !!id
  })
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Expense recorded successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record expense')
    }
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Expense updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update expense')
    }
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Expense deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete expense')
    }
  })
}

export const useApproveExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense'] })
      toast.success('Expense approved successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve expense')
    }
  })
}

export const useRejectExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense'] })
      toast.success('Expense rejected successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject expense')
    }
  })
}

// Expense Statistics
export const useExpenseStatistics = (academicYearId) => {
  return useQuery({
    queryKey: ['expenseStatistics', academicYearId],
    queryFn: () => getExpenseStatistics(academicYearId),
    enabled: !!academicYearId
  })
}