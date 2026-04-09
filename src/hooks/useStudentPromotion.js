import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  validatePromotion,
  promoteStudent,
  bulkPromoteStudents,
  reversePromotion,
  getPromotionHistory,
  getYearWiseFinancialHistory,
  getStudentFinancialSummary,
  getDashboardDuesSummary,
  getStudentsForPromotion,
  getPromotionBatchDetails,
  getPromotionBatches,
  getStudentYearSnapshots,
  getFeeAdjustments,
  createFeeAdjustment,
  updateFeeAdjustment,
  deactivateFeeAdjustment,
  getPromotionStatistics
} from '../api/studentPromotion.api'
import toast from 'react-hot-toast'

// ============================================================================
// VALIDATION HOOKS
// ============================================================================

/**
 * Hook to validate if a student can be promoted
 * @param {string} studentId - UUID of the student
 * @param {string} targetStandardId - UUID of target standard
 * @param {string} targetAcademicYearId - UUID of target academic year
 * @param {boolean} enabled - Whether to run the query
 */
export const useValidatePromotion = (studentId, targetStandardId, targetAcademicYearId, enabled = true) => {
  return useQuery({
    queryKey: ['validate-promotion', studentId, targetStandardId, targetAcademicYearId],
    queryFn: () => validatePromotion(studentId, targetStandardId, targetAcademicYearId),
    enabled: enabled && !!studentId && !!targetStandardId && !!targetAcademicYearId,
    staleTime: 30 * 1000, // 30 seconds
    retry: false
  })
}

// ============================================================================
// PROMOTION MUTATION HOOKS
// ============================================================================

/**
 * Hook to promote a single student
 */
export const usePromoteStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: promoteStudent,
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['promotion-history'] })
      queryClient.invalidateQueries({ queryKey: ['student-financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-dues-summary'] })
      queryClient.invalidateQueries({ queryKey: ['students-for-promotion'] })
      queryClient.invalidateQueries({ queryKey: ['year-snapshots'] })
      queryClient.invalidateQueries({ queryKey: ['promotion-statistics'] })
      
      if (data.success) {
        toast.success('Student promoted successfully')
      } else {
        toast.error(data.error || 'Failed to promote student')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to promote student')
    }
  })
}

/**
 * Hook to promote multiple students in bulk
 */
export const useBulkPromotion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkPromoteStudents,
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['promotion-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-dues-summary'] })
      queryClient.invalidateQueries({ queryKey: ['students-for-promotion'] })
      queryClient.invalidateQueries({ queryKey: ['promotion-batches'] })
      queryClient.invalidateQueries({ queryKey: ['promotion-statistics'] })
      
      if (data.success) {
        const { successful, failed, totalProcessed } = data
        if (failed === 0) {
          toast.success(`All ${successful} students promoted successfully!`)
        } else if (successful === 0) {
          toast.error(`Failed to promote all ${failed} students`)
        } else {
          toast.success(
            `Promoted ${successful} of ${totalProcessed} students. ${failed} failed.`,
            { duration: 5000 }
          )
        }
      } else {
        toast.error(data.error || 'Bulk promotion failed')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to bulk promote students')
    }
  })
}

/**
 * Hook to reverse a promotion
 */
export const useReversePromotion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, promotionHistoryId, reason }) => 
      reversePromotion(studentId, promotionHistoryId, reason),
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['promotion-history'] })
      queryClient.invalidateQueries({ queryKey: ['student-financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-dues-summary'] })
      queryClient.invalidateQueries({ queryKey: ['year-snapshots'] })
      
      if (data.success) {
        toast.success('Promotion reversed successfully')
      } else {
        toast.error(data.error || 'Failed to reverse promotion')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reverse promotion')
    }
  })
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to get promotion history for a student
 * @param {string} studentId - UUID of the student
 */
export const usePromotionHistory = (studentId) => {
  return useQuery({
    queryKey: ['promotion-history', studentId],
    queryFn: () => getPromotionHistory(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Hook to get year-wise financial history for a student
 * @param {string} studentId - UUID of the student
 */
export const useYearWiseFinancialHistory = (studentId) => {
  return useQuery({
    queryKey: ['year-wise-financial-history', studentId],
    queryFn: () => getYearWiseFinancialHistory(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Hook to get complete financial summary for a student
 * @param {string} studentId - UUID of the student
 */
export const useStudentFinancialSummary = (studentId) => {
  return useQuery({
    queryKey: ['student-financial-summary', studentId],
    queryFn: () => getStudentFinancialSummary(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}

/**
 * Hook to get dashboard dues summary
 */
export const useDashboardDuesSummary = () => {
  return useQuery({
    queryKey: ['dashboard-dues-summary'],
    queryFn: getDashboardDuesSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true
  })
}

/**
 * Hook to get students eligible for promotion
 * @param {string} academicYearId - UUID of the academic year
 * @param {string} standardId - Optional UUID of standard to filter by
 */
export const useStudentsForPromotion = (academicYearId, standardId = null) => {
  return useQuery({
    queryKey: ['students-for-promotion', academicYearId, standardId],
    queryFn: () => getStudentsForPromotion(academicYearId, standardId),
    enabled: !!academicYearId,
    staleTime: 1 * 60 * 1000 // 1 minute
  })
}

/**
 * Hook to get promotion batch details
 * @param {string} batchId - UUID of the batch
 */
export const usePromotionBatchDetails = (batchId) => {
  return useQuery({
    queryKey: ['promotion-batch-details', batchId],
    queryFn: () => getPromotionBatchDetails(batchId),
    enabled: !!batchId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Hook to get all promotion batches with filters
 * @param {Object} filters - Filter options
 */
export const usePromotionBatches = (filters = {}) => {
  return useQuery({
    queryKey: ['promotion-batches', filters],
    queryFn: () => getPromotionBatches(filters),
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}

/**
 * Hook to get year snapshots for a student
 * @param {string} studentId - UUID of the student
 */
export const useStudentYearSnapshots = (studentId) => {
  return useQuery({
    queryKey: ['year-snapshots', studentId],
    queryFn: () => getStudentYearSnapshots(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Hook to get fee adjustments for a student
 * @param {string} studentId - UUID of the student
 * @param {string} academicYearId - Optional UUID of academic year
 */
export const useFeeAdjustments = (studentId, academicYearId = null) => {
  return useQuery({
    queryKey: ['fee-adjustments', studentId, academicYearId],
    queryFn: () => getFeeAdjustments(studentId, academicYearId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Hook to get promotion statistics for an academic year
 * @param {string} academicYearId - UUID of the academic year
 */
export const usePromotionStatistics = (academicYearId) => {
  return useQuery({
    queryKey: ['promotion-statistics', academicYearId],
    queryFn: () => getPromotionStatistics(academicYearId),
    enabled: !!academicYearId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

// ============================================================================
// FEE ADJUSTMENT MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a fee adjustment
 */
export const useCreateFeeAdjustment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFeeAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['student-financial-summary'] })
      toast.success('Fee adjustment created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create fee adjustment')
    }
  })
}

/**
 * Hook to update a fee adjustment
 */
export const useUpdateFeeAdjustment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateFeeAdjustment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['student-financial-summary'] })
      toast.success('Fee adjustment updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update fee adjustment')
    }
  })
}

/**
 * Hook to deactivate a fee adjustment
 */
export const useDeactivateFeeAdjustment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateFeeAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['student-financial-summary'] })
      toast.success('Fee adjustment deactivated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate fee adjustment')
    }
  })
}
