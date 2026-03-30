import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockNotifications } from '$lib/mock'
import { redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) return { notifications: mockNotifications }

  const { user } = await locals.safeGetSession()

  const { data: notifications } = await locals.supabase
    .from('notifications')
    .select('*, actor:profiles!actor_id(*), post:posts!post_id(*)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const dedupedNotifications: NonNullable<typeof notifications> = []
  const seenUnreadMessageActors = new Set<string>()

  for (const notification of notifications ?? []) {
    if (notification.type === 'message' && !notification.is_read) {
      const key = `${notification.user_id}:${notification.actor_id}`
      if (seenUnreadMessageActors.has(key)) continue
      seenUnreadMessageActors.add(key)
    }

    dedupedNotifications.push(notification)
  }

  return { notifications: dedupedNotifications }
}

export const actions: Actions = {
  markAll: async ({ locals }) => {
    if (DEMO) throw redirect(303, '/notifications')

    const { user } = await locals.safeGetSession()

    if (!user) {
      throw redirect(303, '/login')
    }

    await locals.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    throw redirect(303, '/notifications')
  }
}
