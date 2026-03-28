import { error, redirect } from '@sveltejs/kit'
import type { NotificationType, Profile } from '$lib/types'

export async function requireUser(locals: App.Locals) {
  const { user } = await locals.safeGetSession()

  if (!user) {
    throw redirect(303, '/login')
  }

  return user
}

export async function requireStaff(locals: App.Locals) {
  const user = await requireUser(locals)
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    throw error(403, 'Vi ne havas aliron al ĉi tiu paĝo')
  }

  return { user, profile: profile as Profile }
}

export async function createNotification(
  locals: App.Locals,
  input: {
    user_id: string
    actor_id: string
    type: NotificationType
    post_id?: string | null
    comment_id?: string | null
    message?: string
  }
) {
  if (input.user_id === input.actor_id) return

  await locals.supabase.from('notifications').insert({
    user_id: input.user_id,
    actor_id: input.actor_id,
    type: input.type,
    post_id: input.post_id ?? null,
    comment_id: input.comment_id ?? null,
    message: input.message ?? ''
  })
}
