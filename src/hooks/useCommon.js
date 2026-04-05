import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getStandards,
  getAcademicYears,
  getCurrentAcademicYear,
  getSchoolProfile,
  updateSchoolProfile,
  getSystemAlerts,
  resolveSystemAlert,
  createSystemAlert,
  getFeeConfigurations,
  updateFeeConfiguration,
  createFeeConfiguration
} from '../api/common.api'
import toast from 'react-hot-toast'

/**
 * Hook to get standards
 */
export const useStandards = () => {
  return useQuery({
    queryKey: ['standards'],
    queryFn: getStandards,
    staleTime: 60 * 60 * 1000, // 1 hour - standards rarely change
  })
}

/**
 * Hook to get academic years
 */
export const useAcademicYears = () => {
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: getAcademicYears,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to get current academic year
 */
export const useCurrentAcademicYear = () => {
  return useQuery({
    queryKey: ['academic-years', 'current'],
    queryFn: getCurrentAcademicYear,
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Hook to get school profile
 */
export const useSchoolProfile = () => {
  return useQuery({
    queryKey: ['school-profile'],
    queryFn: getSchoolProfile,
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Hook to update school profile
 */
export const useUpdateSchoolProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSchoolProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['school-profile'], data)
      toast.success('School profile updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating school profile:', error)
      toast.error(error.message || 'Failed to update school profile')
    }
  })
}

/**
 * Hook to get system alerts
 */
export const useSystemAlerts = (resolved = false) => {
  return useQuery({
    queryKey: ['system-alerts', resolved],
    queryFn: () => getSystemAlerts(resolved),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}

/**
 * Hook to resolve system alert
 */
export const useResolveSystemAlert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertId, resolutionNotes }) => resolveSystemAlert(alertId, resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] })
      toast.success('Alert resolved successfully!')
    },
    onError: (error) => {
      console.error('Error resolving alert:', error)
      toast.error(error.message || 'Failed to resolve alert')
    }
  })
}

/**
 * Hook to create system alert
 */
export const useCreateSystemAlert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSystemAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] })
    },
    onError: (error) => {
      console.error('Error creating alert:', error)
    }
  })
}

/**
 * Hook to get fee configurations
 */
export const useFeeConfigurations = (academicYearId) => {
  return useQuery({
    queryKey: ['fee-configurations', academicYearId],
    queryFn: () => getFeeConfigurations(academicYearId),
    enabled: !!academicYearId,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Hook to update fee configuration
 */
export const useUpdateFeeConfiguration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateFeeConfiguration(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-configurations'] })
      toast.success('Fee configuration updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating fee configuration:', error)
      toast.error(error.message || 'Failed to update fee configuration')
    }
  })
}

/**
 * Hook to create fee configuration
 */
export const useCreateFeeConfiguration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFeeConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-configurations'] })
      toast.success('Fee configuration created successfully!')
    },
    onError: (error) => {
      console.error('Error creating fee configuration:', error)
      toast.error(error.message || 'Failed to create fee configuration')
    }
  })
}