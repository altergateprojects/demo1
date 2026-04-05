import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  getFeeConfigurations,
  createFeeConfiguration,
  updateFeeConfiguration,
  deleteFeeConfiguration,
  getFeePayments,
  createFeePayment,
  reverseFeePayment,
  getFeeStatistics,
  syncStudentFeesWithConfigurations
} from '../api/fees.api'

// Fee Configurations
export const useFeeConfigurations = (academicYearId) => {
  return useQuery({
    queryKey: ['feeConfigurations', academicYearId],
    queryFn: () => getFeeConfigurations(academicYearId)
    // Removed enabled check - allow fetching all configurations when no academicYearId provided
  })
}

export const useCreateFeeConfiguration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFeeConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeConfigurations'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['feeStatistics'] })
      toast.success('Fee configuration created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create fee configuration')
    }
  })
}

export const useUpdateFeeConfiguration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateFeeConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeConfigurations'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['feeStatistics'] })
      toast.success('Fee configuration updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update fee configuration')
    }
  })
}

export const useDeleteFeeConfiguration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFeeConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeConfigurations'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['feeStatistics'] })
      toast.success('Fee configuration deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete fee configuration')
    }
  })
}

// Fee Payments
export const useFeePayments = (filters) => {
  return useQuery({
    queryKey: ['feePayments', filters],
    queryFn: () => getFeePayments(filters)
  })
}

export const useCreateFeePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFeePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Fee payment recorded successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record fee payment')
    }
  })
}

export const useReverseFeePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reverseFeePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Fee payment reversed successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reverse fee payment')
    }
  })
}

// Fee Statistics
export const useFeeStatistics = (academicYearId) => {
  return useQuery({
    queryKey: ['feeStatistics', academicYearId],
    queryFn: () => getFeeStatistics(academicYearId),
    enabled: !!academicYearId
  })
}

// Sync student fees with configurations
export const useSyncStudentFees = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncStudentFeesWithConfigurations,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['feeStatistics'] })
      toast.success(`Successfully updated ${data.updatedCount} student fee records`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sync student fees')
    }
  })
}