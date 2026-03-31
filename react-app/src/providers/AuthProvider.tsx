import { useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setProfile, setInitialized, clear } = useAuthStore()
  const { setTheme, init: initTheme } = useThemeStore()

  useEffect(() => {
    // Init theme from localStorage first
    initTheme()

    async function syncProfile(userId: string) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profile) {
          setProfile(profile)
          if (profile.theme) setTheme(profile.theme)
        }
      } catch (error) {
        console.error('Profile sync failed', error)
      }
    }

    function bootstrapSession(userId: string) {
      setProfile(null)
      setInitialized(true)
      void syncProfile(userId)
    }

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null

        if (user) {
          setUser(user)
          bootstrapSession(user.id)
          return
        }
      } catch (error) {
        console.error('Auth initialization failed', error)
      } finally {
        setInitialized(true)
      }
    }

    initAuth()

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        clear()
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user)
        bootstrapSession(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
