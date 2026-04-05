import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentAcademicYear } from '../lib/academicYear'

const useUIStore = create(
  persist(
    (set, get) => ({
      // Sidebar state
      sidebarCollapsed: false,
      sidebarOpen: false, // For mobile

      // Theme
      theme: 'system', // 'light', 'dark', 'system'
      
      // Academic year selection
      currentAcademicYearId: null,
      currentAcademicYear: getCurrentAcademicYear(),
      
      // Loading states
      globalLoading: false,
      
      // Actions
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setTheme: (theme) => {
        set({ theme })
        
        // Apply theme to document
        const root = document.documentElement
        if (theme === 'dark') {
          root.classList.add('dark')
        } else if (theme === 'light') {
          root.classList.remove('dark')
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
      },
      
      setCurrentAcademicYear: (yearId, yearLabel) => set({ 
        currentAcademicYearId: yearId,
        currentAcademicYear: yearLabel 
      }),
      
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      
      // Initialize theme on app start
      initializeTheme: () => {
        const { theme } = get()
        const root = document.documentElement
        
        if (theme === 'dark') {
          root.classList.add('dark')
        } else if (theme === 'light') {
          root.classList.remove('dark')
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
          
          // Listen for system theme changes
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (get().theme === 'system') {
              if (e.matches) {
                root.classList.add('dark')
              } else {
                root.classList.remove('dark')
              }
            }
          })
        }
      }
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        currentAcademicYear: state.currentAcademicYear
      })
    }
  )
)

export default useUIStore