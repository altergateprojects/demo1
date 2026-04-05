import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  getFinancialSummary,
  getFeeCollectionReport,
  getExpenseReport,
  getStudentFeeStatus,
  getTeacherSalaryReport,
  exportReport,
  getAuditReport,
  getDashboardAnalytics
} from '../api/reports.api'

// Financial Reports
export const useFinancialSummary = (academicYearId, dateFrom, dateTo) => {
  return useQuery({
    queryKey: ['financialSummary', academicYearId, dateFrom, dateTo],
    queryFn: () => getFinancialSummary(academicYearId, dateFrom, dateTo),
    enabled: !!academicYearId && !!dateFrom && !!dateTo
  })
}

export const useFeeCollectionReport = (academicYearId, dateFrom, dateTo) => {
  return useQuery({
    queryKey: ['feeCollectionReport', academicYearId, dateFrom, dateTo],
    queryFn: () => getFeeCollectionReport(academicYearId, dateFrom, dateTo),
    enabled: !!academicYearId && !!dateFrom && !!dateTo
  })
}

export const useExpenseReport = (academicYearId, dateFrom, dateTo) => {
  return useQuery({
    queryKey: ['expenseReport', academicYearId, dateFrom, dateTo],
    queryFn: () => getExpenseReport(academicYearId, dateFrom, dateTo),
    enabled: !!academicYearId && !!dateFrom && !!dateTo
  })
}

export const useStudentFeeStatus = (academicYearId) => {
  return useQuery({
    queryKey: ['studentFeeStatus', academicYearId],
    queryFn: () => getStudentFeeStatus(academicYearId),
    enabled: !!academicYearId
  })
}

export const useTeacherSalaryReport = (academicYearId, dateFrom, dateTo) => {
  return useQuery({
    queryKey: ['teacherSalaryReport', academicYearId, dateFrom, dateTo],
    queryFn: () => getTeacherSalaryReport(academicYearId, dateFrom, dateTo),
    enabled: !!academicYearId && !!dateFrom && !!dateTo
  })
}

// Export Reports
export const useExportReport = () => {
  return useMutation({
    mutationFn: ({ reportType, filters }) => exportReport(reportType, filters),
    onSuccess: () => {
      toast.success('Report exported successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to export report')
    }
  })
}

// Audit Reports
export const useAuditReport = (filters) => {
  return useQuery({
    queryKey: ['auditReport', filters],
    queryFn: () => getAuditReport(filters)
  })
}

// Dashboard Analytics
export const useDashboardAnalytics = (academicYearId) => {
  return useQuery({
    queryKey: ['dashboardAnalytics', academicYearId],
    queryFn: () => getDashboardAnalytics(academicYearId),
    enabled: !!academicYearId
  })
}