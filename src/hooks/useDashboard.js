import { useQuery } from '@tanstack/react-query'
import { 
  getDashboardSummary,
  getStandardFeeSummary,
  getRecentActivity,
  getMonthlyFeeCollectionTrend
} from '../api/dashboard.api'

/**
 * Hook to get dashboard summary - Auto-refreshes on window focus
 */
export const useDashboardSummary = (academicYearId) => {
  return useQuery({
    queryKey: ['dashboard', 'summary', academicYearId],
    queryFn: () => getDashboardSummary(academicYearId),
    enabled: !!academicYearId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when returning to dashboard
    refetchOnMount: true, // Always refetch on mount
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

/**
 * Hook to get standard-wise fee summary - Auto-refreshes on window focus
 */
export const useStandardFeeSummary = (academicYearId) => {
  return useQuery({
    queryKey: ['dashboard', 'standard-fee-summary', academicYearId],
    queryFn: () => getStandardFeeSummary(academicYearId),
    enabled: !!academicYearId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

/**
 * Hook to get recent activity - Auto-refreshes frequently
 */
export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: () => getRecentActivity(limit),
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

/**
 * Hook to get monthly fee collection trend
 */
export const useMonthlyFeeCollectionTrend = (academicYearId, months = 6) => {
  return useQuery({
    queryKey: ['dashboard', 'fee-collection-trend', academicYearId, months],
    queryFn: () => getMonthlyFeeCollectionTrend(academicYearId, months),
    enabled: !!academicYearId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get all dashboard data at once
 */
export const useDashboardData = (academicYearId) => {
  const summary = useDashboardSummary(academicYearId)
  const standardSummary = useStandardFeeSummary(academicYearId)
  const recentActivity = useRecentActivity(5)
  const feeCollectionTrend = useMonthlyFeeCollectionTrend(academicYearId)

  return {
    summary,
    standardSummary,
    recentActivity,
    feeCollectionTrend,
    isLoading: summary.isLoading || standardSummary.isLoading || recentActivity.isLoading,
    error: summary.error || standardSummary.error || recentActivity.error
  }
}