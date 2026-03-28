import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockNotifications } from '$lib/mock'
import type { PageServerLoad } from './$types'

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

  return { notifications: notifications ?? [] }
}
