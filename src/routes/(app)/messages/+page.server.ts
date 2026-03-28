import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockConversations } from '$lib/mock'
import type { PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) return { conversations: mockConversations }

  const { user } = await locals.safeGetSession()

  const { data: conversations } = await locals.supabase
    .from('conversations')
    .select('*, participants:conversation_participants(profile:profiles(*)), last_message:messages(*)')
    .eq('conversation_participants.user_id', user?.id)
    .order('updated_at', { ascending: false })

  return { conversations: conversations ?? [] }
}
