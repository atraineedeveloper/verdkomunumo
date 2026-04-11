import { useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setProfile, setInitialized, clear } = useAuthStore()
  const { init: initTheme } = useThemeStore()

  useEffect(() => {
    // Init theme from localStorage first
    initTheme()

    async function syncProfile(userId: string, options?: { preserveProfile?: boolean }) {
      try {
        if (!options?.preserveProfile) {
          setProfile(null)
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profile) {
          setProfile(profile)
        }
      } catch {
        // Silently fail profile sync
      }
    }

    function bootstrapSession(userId: string, options?: { preserveProfile?: boolean }) {
      setInitialized(true)
      void syncProfile(userId, options)
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
      } catch {
        // Silently fail auth initialization
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

      if (event === 'SIGNED_IN') {
        setUser(session.user)
        bootstrapSession(session.user.id)
      }

      if (event === 'TOKEN_REFRESHED') {
        setUser(session.user)
        bootstrapSession(session.user.id, { preserveProfile: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [initTheme, setProfile, setUser, setInitialized, clear])

  return <>{children}</>
}
