import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query/keys'
import { useToastStore } from '@/stores/toasts'
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

const TYPE_ICONS: Record<NotificationType, string> = {
  comment: 'message-square',
  follow: 'user-plus',
  mention: 'at-sign',
  message: 'message-square',
  like: 'heart',
  category_approved: 'check-circle',
  category_rejected: 'shield-alert',
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

          // In-App Toast Notification mechanism
          if (isTabVisible()) {
            const title = TYPE_TITLES[notif.type] ?? 'Verdkomunumo'
            const icon = TYPE_ICONS[notif.type] ?? 'info'
            const body = notif.message || title
            useToastStore.getState().interaction(`${title}: ${body}`, icon)
            return
          }

          // Native OS/Browser Notification mechanism
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
