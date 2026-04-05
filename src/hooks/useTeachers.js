import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersSummary
} from '../api/teachers.api'
import toast from 'react-hot-toast'

/**
 * Hook to get teachers with pagination and filtering
 */
export const useTeachers = (params = {}) => {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: () => getTeachers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true
  })
}

/**
 * Hook to get a single teacher
 */
export const useTeacher = (id) => {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => getTeacher(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to create a teacher
 */
export const useCreateTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeacher,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Teacher ${data.full_name} created successfully!`)
    },
    onError: (error) => {
      console.error('Error creating teacher:', error)
      toast.error(error.message || 'Failed to create teacher')
    }
  })
}

/**
 * Hook to update a teacher
 */
export const useUpdateTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateTeacher(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.setQueryData(['teachers', data.id], data)
      toast.success(`Teacher ${data.full_name} updated successfully!`)
    },
    onError: (error) => {
      console.error('Error updating teacher:', error)
      toast.error(error.message || 'Failed to update teacher')
    }
  })
}

/**
 * Hook to delete a teacher
 */
export const useDeleteTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTeacher,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Teacher ${data.full_name} deleted successfully!`)
    },
    onError: (error) => {
      console.error('Error deleting teacher:', error)
      toast.error(error.message || 'Failed to delete teacher')
    }
  })
}

/**
 * Hook to get teachers summary
 */
export const useTeachersSummary = () => {
  return useQuery({
    queryKey: ['teachers', 'summary'],
    queryFn: getTeachersSummary,
    staleTime: 5 * 60 * 1000
  })
}