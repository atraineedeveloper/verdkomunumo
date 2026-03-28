import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockConversations, mockMessages } from '$lib/mock'
import { messageSchema } from '$lib/validators'
import { applyXSystem } from '$lib/utils'
import { createNotification, requireUser } from '$lib/server/social'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

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

export const actions: Actions = {
  send: async ({ request, locals, params }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)
    const formData = await request.formData()
    const raw = { content: formData.get('content') }

    const result = messageSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors })
    }

    const { data: participant } = await locals.supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', params.conversationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!participant) {
      throw error(403, 'Vi ne apartenas al ĉi tiu konversacio')
    }

    const { error: insertError } = await locals.supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: user.id,
        content: applyXSystem(result.data.content.trim())
      })

    if (insertError) {
      return fail(500, { message: insertError.message })
    }

    await locals.supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', params.conversationId)
      .eq('user_id', user.id)

    const { data: recipients } = await locals.supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', params.conversationId)
      .neq('user_id', user.id)

    await Promise.all(
      (recipients ?? []).map((recipient) =>
        createNotification(locals, {
          user_id: recipient.user_id,
          actor_id: user.id,
          type: 'message'
        })
      )
    )

    throw redirect(303, `/messages/${params.conversationId}`)
  }
}
