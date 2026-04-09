import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  // State
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  isInitialized: false,

  // Actions
  initialize: async () => {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        set({ isLoading: false, isInitialized: true })
        return
      }

      if (session) {
        await get().setSession(session)
      } else {
        set({ 
          session: null, 
          user: null, 
          profile: null, 
          role: null, 
          isLoading: false,
          isInitialized: true 
        })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await get().setSession(session)
        } else if (event === 'SIGNED_OUT') {
          set({ 
            session: null, 
            user: null, 
            profile: null, 
            role: null, 
            isLoading: false 
          })
        }
      })

      set({ isInitialized: true })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ isLoading: false, isInitialized: true })
    }
  },

  setSession: async (session) => {
    if (!session) {
      set({ 
        session: null, 
        user: null, 
        profile: null, 
        role: null, 
        isLoading: false 
      })
      return
    }

    try {
      // Fetch user profile with longer timeout and better error handling
      let profile = null
      try {
        const { data, error } = await Promise.race([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile query timeout')), 10000)
          )
        ])

        if (error) {
          // Try to create a basic profile if it doesn't exist
          if (error.code === 'PGRST116') { // No rows returned
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([{
                id: session.user.id,
                full_name: session.user.email?.split('@')[0] || 'User',
                role: 'staff',
                phone_number: null,
                is_active: true
              }])
              .select()
              .single()

            if (!createError) {
              profile = newProfile
            }
          }
        } else {
          profile = data
        }
      } catch (profileError) {
        // Continue without profile
      }

      // Update last login (don't wait for this)
      supabase
        .from('user_profiles')
        .update({ 
          last_login_at: new Date().toISOString(),
          last_login_ip: null
        })
        .eq('id', session.user.id)
        .then(() => {})
        .catch(() => {})

      set({ 
        session, 
        user: session.user, 
        profile, 
        role: profile?.role, 
        isLoading: false 
      })
    } catch (error) {
      // Still set the session even if profile fails
      set({ 
        session, 
        user: session.user, 
        profile: null, 
        role: null, 
        isLoading: false 
      })
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ 
        session: null, 
        user: null, 
        profile: null, 
        role: null, 
        isLoading: false 
      })
      
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
  },

  refreshProfile: async () => {
    const { session } = get()
    if (!session) return

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      set({ profile, role: profile.role })
      return { success: true, profile }
    } catch (error) {
      console.error('Error refreshing profile:', error)
      return { success: false, error: error.message }
    }
  },

  // Helper methods
  hasRole: (requiredRoles) => {
    const { role } = get()
    if (!role) return false
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(role)
    }
    
    return role === requiredRoles
  },

  isAdmin: () => get().role === 'admin',
  isFinance: () => ['admin', 'finance'].includes(get().role),
  isStaff: () => ['admin', 'finance', 'staff'].includes(get().role)
}))

export default useAuthStore