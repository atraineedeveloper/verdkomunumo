import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { buildPresencePayload, getActivePresenceMap, type PresenceStatePayload } from '@/lib/presence'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { usePresenceStore } from '@/stores/presence'

const GLOBAL_PRESENCE_CHANNEL = 'global-presence'
const PRESENCE_SYNC_INTERVAL_MS = 30 * 1000

export function useGlobalPresence() {
  const { pathname } = useLocation()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const profileLoaded = useAuthStore((state) => state.profileLoaded)
  const setActiveUsers = usePresenceStore((state) => state.setActiveUsers)
  const clearPresence = usePresenceStore((state) => state.clear)

  useEffect(() => {
    if (!user || !profileLoaded || !profile || profile.id !== user.id) {
      clearPresence()
      return
    }

    const channel = supabase.channel(GLOBAL_PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    const syncActiveUsers = () => {
      setActiveUsers(getActivePresenceMap(channel.presenceState() as PresenceStatePayload))
    }

    const trackPresence = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      void channel.track(buildPresencePayload(profile))
    }

    channel
      .on('presence', { event: 'sync' }, syncActiveUsers)
      .on('presence', { event: 'join' }, syncActiveUsers)
      .on('presence', { event: 'leave' }, syncActiveUsers)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          trackPresence()
          syncActiveUsers()
        }
      })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackPresence()
      }
      syncActiveUsers()
    }

    const handleFocus = () => {
      trackPresence()
      syncActiveUsers()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const intervalId = window.setInterval(() => {
      trackPresence()
      syncActiveUsers()
    }, PRESENCE_SYNC_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(intervalId)
      clearPresence()
      void channel.untrack()
      void supabase.removeChannel(channel)
    }
  }, [user, profileLoaded, profile, pathname, setActiveUsers, clearPresence])
}
