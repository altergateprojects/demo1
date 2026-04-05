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
      console.log('🔄 Initializing auth store...')
      
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error getting session:', error)
        set({ isLoading: false, isInitialized: true })
        return
      }

      console.log('📋 Session status:', session ? 'Found session' : 'No session')

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
        console.log('🔄 Auth state changed:', event)
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
      console.log('✅ Auth store initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
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
      console.log('🔄 Setting session for user:', session.user.email)
      
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
            setTimeout(() => reject(new Error('Profile query timeout')), 10000) // Increased to 10 seconds
          )
        ])

        if (error) {
          console.warn('⚠️ Error fetching profile:', error.message)
          // Try to create a basic profile if it doesn't exist
          if (error.code === 'PGRST116') { // No rows returned
            console.log('🔄 Creating basic user profile...')
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([{
                id: session.user.id,
                full_name: session.user.email?.split('@')[0] || 'User',
                role: 'staff', // Default role
                phone_number: null,
                is_active: true
              }])
              .select()
              .single()

            if (!createError) {
              profile = newProfile
              console.log('✅ Basic profile created successfully')
            } else {
              console.error('❌ Failed to create profile:', createError.message)
            }
          }
        } else {
          profile = data
        }
      } catch (profileError) {
        console.warn('⚠️ Profile fetch failed:', profileError.message)
        // Continue without profile
      }

      console.log('✅ Profile loaded:', profile.full_name, profile.role)

      // Update last login (don't wait for this)
      supabase
        .from('user_profiles')
        .update({ 
          last_login_at: new Date().toISOString(),
          last_login_ip: null
        })
        .eq('id', session.user.id)
        .then(() => console.log('📝 Last login updated'))
        .catch(err => console.warn('⚠️ Could not update last login:', err.message))

      set({ 
        session, 
        user: session.user, 
        profile, 
        role: profile.role, 
        isLoading: false 
      })
    } catch (error) {
      console.error('❌ Error setting session:', error.message)
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
      console.log('Attempting to sign in with:', email)
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Supabase auth error:', error)
        throw error
      }

      console.log('Sign in successful:', data)
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