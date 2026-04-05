import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Stores
import useAuthStore from './store/authStore'
import useUIStore from './store/uiStore'

// Components
import AuthGuard from './components/shared/AuthGuard'
import Layout from './components/layout/Layout'
import LoadingScreen from './components/ui/LoadingScreen'

// Pages
import LoginPage from './pages/Login/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import StudentsListPage from './pages/Students/StudentsListPage'
import StudentDetailPage from './pages/Students/StudentDetailPage'
import AddStudentPage from './pages/Students/AddStudentPage'
import EditStudentPage from './pages/Students/EditStudentPage'
import StudentDuesPage from './pages/Students/StudentDuesPage'
import TeachersListPage from './pages/Teachers/TeachersListPage'
import TeacherDetailPage from './pages/Teachers/TeacherDetailPage'
import AddTeacherPage from './pages/Teachers/AddTeacherPage'
import EditTeacherPage from './pages/Teachers/EditTeacherPage'
import FeesListPage from './pages/Fees/FeesListPageNew'
import ExpensesListPage from './pages/Expenses/ExpensesListPage'
import ExpenseDetailPage from './pages/Expenses/ExpenseDetailPage'
import EditExpensePage from './pages/Expenses/EditExpensePage'
import ExpenseAuditPage from './pages/Expenses/ExpenseAuditPage'
import ReportsPage from './pages/Reports/ReportsPage'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
})

function App() {
  const { initialize, isLoading, isInitialized, session } = useAuthStore()
  const { initializeTheme } = useUIStore()

  useEffect(() => {
    // Initialize theme
    initializeTheme()
    
    // Initialize auth
    initialize()
  }, [initialize, initializeTheme])

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return <LoadingScreen />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                session ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            
            {/* Protected routes */}
            <Route path="/*" element={
              <AuthGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* Students routes */}
                    <Route path="/students" element={<StudentsListPage />} />
                    <Route path="/students/add" element={<AddStudentPage />} />
                    <Route path="/students/dues" element={<StudentDuesPage />} />
                    <Route path="/students/:id" element={<StudentDetailPage />} />
                    <Route path="/students/:id/edit" element={<EditStudentPage />} />
                    
                    {/* Teachers routes */}
                    <Route path="/teachers" element={<TeachersListPage />} />
                    <Route path="/teachers/add" element={<AddTeacherPage />} />
                    <Route path="/teachers/:id" element={<TeacherDetailPage />} />
                    <Route path="/teachers/:id/edit" element={<EditTeacherPage />} />
                    
                    {/* Fees routes */}
                    <Route path="/fees" element={<FeesListPage />} />
                    
                    {/* Expenses routes */}
                    <Route path="/expenses" element={<ExpensesListPage />} />
                    <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
                    <Route path="/expenses/:id/edit" element={<EditExpensePage />} />
                    <Route path="/expenses/:id/audit" element={<ExpenseAuditPage />} />
                    
                    {/* Salary routes */}
                    <Route path="/salary" element={<div>Salary - Coming Soon</div>} />
                    
                    {/* Reports routes */}
                    <Route path="/reports" element={<ReportsPage />} />
                    
                    {/* Settings routes */}
                    <Route path="/settings" element={<div>Settings - Coming Soon</div>} />
                    
                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </AuthGuard>
            } />
          </Routes>
        </div>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  )
}

export default App