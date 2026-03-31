import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { queryKeys } from '@/lib/query/keys'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import type { Notification, NotificationType } from '@/lib/types'
import { routes } from '@/lib/routes'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { ListSkeleton } from '@/components/ui/ListSkeleton'

const notifKeyMap: Record<NotificationType, string> = {
  like: 'notif_liked_post',
  comment: 'notif_commented',
  follow: 'notif_followed',
  message: 'notif_message',
  mention: 'notif_mention',
  category_approved: 'notif_category_approved',
  category_rejected: 'notif_category_rejected',
}

function notifLink(notif: Notification): string {
  if (notif.type === 'follow' && notif.actor?.username) return routes.profile(notif.actor.username)
  if (notif.post_id) return routes.post(notif.post_id)
  if (notif.type === 'message') return routes.messages
  return '#'
}

async function fetchNotifications(userId: string) {
  const { data } = await supabase
    .from('notifications')
    .select('*, actor:profiles!actor_id(*), post:posts!post_id(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const deduped: Notification[] = []
  const seenUnreadMessageActors = new Set<string>()
  for (const notification of (data ?? []) as Notification[]) {
    if (notification.type === 'message' && !notification.is_read) {
      const key = `${notification.user_id}:${notification.actor_id}`
      if (seenUnreadMessageActors.has(key)) continue
      seenUnreadMessageActors.add(key)
    }
    deduped.push(notification)
  }
  return deduped
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data: notifications = [], isLoading, isFetching } = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => fetchNotifications(user!.id),
    enabled: Boolean(user),
  })

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    },
    onMutate: async () => {
      const notificationsKey = queryKeys.notifications()
      await queryClient.cancelQueries({ queryKey: notificationsKey })
      const previousNotifications = queryClient.getQueryData(notificationsKey)
      queryClient.setQueryData(notificationsKey, (current: Notification[] | undefined) =>
        (current ?? []).map((notification) => ({ ...notification, is_read: true })),
      )
      return { previousNotifications, notificationsKey }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(context.notificationsKey, context.previousNotifications)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.appLayout() })
    },
  })

  return (
    <>
      <Helmet><title>{t('notif_title')} — Verdkomunumo</title></Helmet>

      <div className="header">
        <h1>{t('notif_title')}</h1>
        <div className="header-actions">
        {isFetching && !isLoading && <InlineSpinner size={13} className="text-[var(--color-primary)]" />}
        {notifications.some((n) => !n.is_read) && (
          <button className="mark-all" type="button" onClick={() => markAllMutation.mutate()}>
            {markAllMutation.isPending ? <InlineSpinner size={12} className="mr-1.5" /> : null}
            {t('notif_mark_all')}
          </button>
        )}
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton items={5} avatarSize={40} />
      ) : notifications.length === 0 ? (
        <p className="empty"><Bell size={16} strokeWidth={1.75} /> {t('notif_empty')}</p>
      ) : (
        <div className="list">
          {notifications.map((notif) => (
            <Link key={notif.id} to={notifLink(notif)} className={`row${!notif.is_read ? ' unread' : ''}`}>
              {notif.actor ? (
                <img src={getAvatarUrl(notif.actor.avatar_url, notif.actor.display_name)} alt={notif.actor.display_name} className="ava" />
              ) : (
                <div className="ava sys"><Bell size={20} strokeWidth={1.75} /></div>
              )}
              <div className="body">
                <p className="text">
                  {notif.actor && <strong>{notif.actor.display_name} </strong>}
                  {t(notifKeyMap[notif.type])}
                </p>
                <span className="time">{formatDate(notif.created_at)}</span>
              </div>
              {!notif.is_read && <span className="dot" />}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0.25rem; gap: 0.5rem; }
        .header-actions { display: flex; align-items: center; gap: 0.6rem; }
        h1 { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; color: var(--color-text); margin: 0; }
        .mark-all { background: none; border: 1px solid var(--color-border); border-radius: 5px; padding: 0.3rem 0.75rem; font-size: 0.78rem; color: var(--color-text-muted); cursor: pointer; font-family: inherit; transition: color 0.12s, border-color 0.12s; display: inline-flex; align-items: center; justify-content: center; }
        .mark-all:hover { color: var(--color-primary); border-color: var(--color-primary); }
        .empty { text-align: center; padding: 3rem 0; font-size: 0.875rem; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
        .list { display: flex; flex-direction: column; }
        .row { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 0; border-bottom: 1px solid var(--color-border); text-decoration: none; position: relative; transition: background 0.12s; border-radius: 0; }
        .row:hover { background: var(--color-surface-alt); margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; }
        .row.unread { background: var(--color-primary-dim); margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 6px; }
        .ava { width: 40px; height: 40px; border-radius: 99px; object-fit: cover; flex-shrink: 0; }
        .sys { display: flex; align-items: center; justify-content: center; background: var(--color-surface-alt); border: 1px solid var(--color-border); color: var(--color-text-muted); }
        .body { flex: 1; min-width: 0; }
        .text { font-size: 0.875rem; color: var(--color-text); margin: 0 0 0.15rem; line-height: 1.4; }
        .time { font-size: 0.75rem; color: var(--color-text-muted); }
        .dot { width: 7px; height: 7px; border-radius: 99px; background: var(--color-primary); flex-shrink: 0; }
      `}</style>
    </>
  )
}
