import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query/keys'
import {
  isTabVisible,
  requestPermission,
  showBrowserNotification,
  shouldNotify,
} from '@/lib/browserNotifications'
import type { NotificationType } from '@/lib/types'

interface RawNotification {
  id: string
  user_id: string
  type: NotificationType
  message: string
}

const TYPE_TITLES: Record<NotificationType, string> = {
  comment: 'Nova komento',
  follow: 'Nova sekvanto',
  mention: 'Vi estis menciita',
  message: 'Nova mesaĝo',
  like: 'Nova ŝato',
  category_approved: 'Kategorio akceptita',
  category_rejected: 'Kategorio malakceptita',
}

export function usePushNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`push-notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const notif = payload.new as RawNotification

          // Always refresh the badge count
          queryClient.invalidateQueries({ queryKey: queryKeys.appLayout() })

          // Skip browser notification if tab is visible or type is not worthy
          if (isTabVisible()) return
          if (!shouldNotify(notif.type)) return

          const granted = await requestPermission()
          if (!granted) return

          showBrowserNotification(
            TYPE_TITLES[notif.type] ?? 'Verdkomunumo',
            notif.message || TYPE_TITLES[notif.type],
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, queryClient])
}
