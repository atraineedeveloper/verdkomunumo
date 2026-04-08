import { useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setProfile, setInitialized, setProfileLoaded, clear } = useAuthStore()
  const { init: initTheme } = useThemeStore()

  useEffect(() => {
    // Init theme from localStorage first
    initTheme()

    async function syncProfile(userId: string, options?: { preserveProfile?: boolean }) {
      setInitialized(false)
      setProfileLoaded(false)

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
      } catch (error) {
        console.error('Profile sync failed', error)
      } finally {
        setProfileLoaded(true)
        setInitialized(true)
      }
    }

    function queueProfileSync(userId: string, options?: { preserveProfile?: boolean }) {
      window.setTimeout(() => {
        void syncProfile(userId, options)
      }, 0)
    }

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null

        if (user) {
          setUser(user)
          await syncProfile(user.id)
          return
        }
      } catch (error) {
        console.error('Auth initialization failed', error)
      } finally {
        if (!useAuthStore.getState().user) {
          setProfile(null)
          setProfileLoaded(true)
          setInitialized(true)
        }
      }
    }

    initAuth()

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        clear()
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const currentUser = useAuthStore.getState().user
        const isSameUser = !!currentUser && currentUser.id === session.user.id
        setUser(session.user)
        queueProfileSync(session.user.id, { preserveProfile: isSameUser })
      }

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setUser(session.user)
        queueProfileSync(session.user.id, { preserveProfile: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [initTheme, setProfile, setUser, setInitialized, setProfileLoaded, clear])

  return <>{children}</>
}
