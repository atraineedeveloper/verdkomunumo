import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { ToastViewport } from '@/components/ToastViewport'
import { FloatingSuggestionButton } from '@/components/FloatingSuggestionButton'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { queryKeys } from '@/lib/query/keys'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import type { Category } from '@/lib/types'

async function fetchAppLayoutData(userId: string) {
  const [categoriesRes, notifRes, membershipsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
    supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId),
  ])

  const memberships = membershipsRes.data ?? []
  const conversationIds = memberships.map((m) => m.conversation_id)
  let unreadMessagesCount = 0

  if (conversationIds.length > 0) {
    const { data: unreadCandidates } = await supabase
      .from('messages')
      .select('conversation_id, created_at')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)

    if (unreadCandidates?.length) {
      const lastReadMap = new Map(memberships.map((m) => [m.conversation_id, m.last_read_at]))
      unreadMessagesCount = unreadCandidates.filter((msg) => {
        const lastReadAt = lastReadMap.get(msg.conversation_id)
        return !lastReadAt || new Date(msg.created_at) > new Date(lastReadAt)
      }).length
    }
  }

  return {
    categories: (categoriesRes.data ?? []) as Category[],
    unreadNotificationsCount: notifRes.count ?? 0,
    unreadMessagesCount,
  }
}

export function AppLayout() {
  const user = useAuthStore((s) => s.user)

  usePushNotifications(user?.id)

  const { data } = useQuery({
    queryKey: queryKeys.appLayout(),
    queryFn: () => fetchAppLayoutData(user!.id),
    enabled: !!user,
    staleTime: 1000 * 30,
  })

  return (
    <>
      <Navbar
        unreadNotificationsCount={data?.unreadNotificationsCount ?? 0}
        unreadMessagesCount={data?.unreadMessagesCount ?? 0}
      />

      <div className="max-w-[1100px] mx-auto px-5 pt-7 pb-[5.5rem] md:pb-8 flex gap-10 items-start">
        <div className="hidden md:block sticky top-[78px]">
          <Sidebar categories={data?.categories ?? []} />
        </div>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <MobileNav
        unreadNotificationsCount={data?.unreadNotificationsCount ?? 0}
        unreadMessagesCount={data?.unreadMessagesCount ?? 0}
      />
      <FloatingSuggestionButton />
      <ToastViewport />
    </>
  )
}
