import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const result = await signIn(data.email, data.password)
      
      if (result.success) {
        toast.success('Welcome back!')
      } else {
        console.error('Login error details:', result.error)
        toast.error(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login exception:', error)
      toast.error('An unexpected error occurred: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Demo credentials for testing
  const demoCredentials = [
    { email: 'admin@school.edu', password: 'admin123', role: 'Administrator' },
    { email: 'finance@school.edu', password: 'finance123', role: 'Finance Staff' },
    { email: 'staff@school.edu', password: 'staff123', role: 'Staff' }
  ]

  const fillDemoCredentials = (email, password) => {
    document.getElementById('email').value = email
    document.getElementById('password').value = password
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">SA</span>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900 dark:text-slate-100">
          School Financial Audit System
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card px-6 py-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'border-red-300 dark:border-red-600' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`input-field ${errors.password ? 'border-red-300 dark:border-red-600' : ''}`}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex justify-center items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Demo Credentials (for testing):
            </h3>
            <div className="space-y-2">
              {demoCredentials.map((cred, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => fillDemoCredentials(cred.email, cred.password)}
                  className="w-full text-left p-2 text-xs bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">{cred.role}</div>
                  <div className="text-slate-600 dark:text-slate-400">{cred.email}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Click any credential above to auto-fill the form
            </p>
            
            {/* Connection Status */}
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Supabase Setup Required
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    To use login functionality, you need to set up the Supabase database and create demo users. 
                    Check the <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">setup.md</code> file for instructions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © 2024 School Financial Audit Management System
        </p>
      </div>
    </div>
  )
}

export default LoginPage