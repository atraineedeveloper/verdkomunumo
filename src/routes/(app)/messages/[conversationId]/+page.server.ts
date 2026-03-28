import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockConversations, mockMessages } from '$lib/mock'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ params, locals }) => {
  if (DEMO) {
    const conversation = mockConversations.find((c) => c.id === params.conversationId)
    if (!conversation) throw error(404, 'Konversacio ne trovita')
    const messages = mockMessages[params.conversationId] ?? []
    return { conversation, messages }
  }

  const { user } = await locals.safeGetSession()

  const { data: conversation } = await locals.supabase
    .from('conversations')
    .select('*, participants:conversation_participants(profile:profiles(*))')
    .eq('id', params.conversationId)
    .single()

  if (!conversation) throw error(404, 'Konversacio ne trovita')

  const { data: messages } = await locals.supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', params.conversationId)
    .order('created_at')

  // Mark messages as read
  await locals.supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', params.conversationId)
    .neq('sender_id', user?.id)

  return { conversation, messages: messages ?? [] }
}
