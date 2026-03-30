import { redirect } from '@sveltejs/kit'
import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockCategories, mockConversations, mockNotifications } from '$lib/mock'
import type { LayoutServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (DEMO) {
    return {
      categories: mockCategories,
      unreadNotificationsCount: mockNotifications.filter((notification) => !notification.is_read).length,
      unreadMessagesCount: mockConversations.reduce(
        (total, conversation) => total + (conversation.unread_count ?? 0),
        0
      )
    }
  }

  const { user } = await locals.safeGetSession()

  if (!user) {
    throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`)
  }

  const [categoriesRes, notificationsRes, membershipsRes] = await Promise.all([
    locals.supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    locals.supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
    locals.supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)
  ])

  const memberships = membershipsRes.data ?? []
  const conversationIds = memberships.map((membership) => membership.conversation_id)

  let unreadMessagesCount = 0

  if (conversationIds.length > 0) {
    const { data: unreadCandidates } = await locals.supabase
      .from('messages')
      .select('conversation_id, created_at')
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)

    if (unreadCandidates?.length) {
      const lastReadByConversation = new Map(
        memberships.map((membership) => [membership.conversation_id, membership.last_read_at])
      )

      unreadMessagesCount = unreadCandidates.filter((message) => {
        const lastReadAt = lastReadByConversation.get(message.conversation_id)
        return !lastReadAt || new Date(message.created_at) > new Date(lastReadAt)
      }).length
    }
  }

  return {
    categories: categoriesRes.data ?? [],
    unreadNotificationsCount: notificationsRes.count ?? 0,
    unreadMessagesCount
  }
}
