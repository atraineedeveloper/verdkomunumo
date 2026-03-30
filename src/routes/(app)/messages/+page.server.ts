import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockConversations } from '$lib/mock'
import { requireUser } from '$lib/server/social'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) return { conversations: mockConversations }

  const user = await requireUser(locals)

  await locals.supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('type', 'message')
    .eq('is_read', false)

  const { data: memberships, error: membershipsError } = await locals.supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)

  if (membershipsError || !memberships) {
    return { conversations: [] }
  }

  const conversationIds = memberships.map((membership) => membership.conversation_id)
  if (conversationIds.length === 0) {
    return { conversations: [] }
  }

  const [conversationsRes, participantRowsRes, messageRowsRes] = await Promise.all([
    locals.supabase.from('conversations').select('*').in('id', conversationIds).order('updated_at', { ascending: false }),
    locals.supabase
      .from('conversation_participants')
      .select('conversation_id, profile:profiles(*)')
      .in('conversation_id', conversationIds),
    locals.supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, is_read, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
  ])

  const participantsByConversation = new Map<string, any[]>()
  for (const row of participantRowsRes.data ?? []) {
    const participants = participantsByConversation.get(row.conversation_id) ?? []
    if (row.profile) participants.push(row.profile)
    participantsByConversation.set(row.conversation_id, participants)
  }

  const latestMessageByConversation = new Map<string, any>()
  const unreadCountByConversation = new Map<string, number>()
  const lastReadAtByConversation = new Map(
    memberships.map((membership) => [membership.conversation_id, membership.last_read_at ?? new Date(0).toISOString()])
  )

  for (const message of messageRowsRes.data ?? []) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message)
    }

    const lastReadAt = lastReadAtByConversation.get(message.conversation_id) ?? new Date(0).toISOString()
    if (message.sender_id !== user.id && message.created_at > lastReadAt) {
      unreadCountByConversation.set(
        message.conversation_id,
        (unreadCountByConversation.get(message.conversation_id) ?? 0) + 1
      )
    }
  }

  const conversations = (conversationsRes.data ?? []).map((conversation) => ({
    ...conversation,
    participants: participantsByConversation.get(conversation.id) ?? [],
    last_message: latestMessageByConversation.get(conversation.id) ?? null,
    unread_count: unreadCountByConversation.get(conversation.id) ?? 0
  }))

  return { conversations }
}

export const actions: Actions = {
  start: async ({ request, locals }) => {
    if (DEMO) throw redirect(303, '/messages/conv-001')

    const user = await requireUser(locals)
    const formData = await request.formData()
    const targetId = formData.get('target_id') as string

    if (!targetId || targetId === user.id) {
      return fail(400, { message: 'Nevalida ricevonto' })
    }

    const { data: existing } = await locals.supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (existing && existing.length > 0) {
      const myConvIds = existing.map((row) => row.conversation_id)
      const { data: shared } = await locals.supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', targetId)
        .in('conversation_id', myConvIds)
        .limit(1)
        .maybeSingle()

      if (shared) throw redirect(303, `/messages/${shared.conversation_id}`)
    }

    const conversationId = crypto.randomUUID()

    const { error: conversationError } = await locals.supabase
      .from('conversations')
      .insert({ id: conversationId })

    if (conversationError) {
      return fail(500, { message: conversationError.message })
    }

    const { error: selfParticipantError } = await locals.supabase
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: user.id })

    if (selfParticipantError) {
      return fail(500, { message: selfParticipantError.message })
    }

    const { error: targetParticipantError } = await locals.supabase
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: targetId })

    if (targetParticipantError) {
      return fail(500, { message: targetParticipantError.message })
    }

    throw redirect(303, `/messages/${conversationId}`)
  }
}
