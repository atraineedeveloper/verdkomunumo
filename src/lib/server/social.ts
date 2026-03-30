import { error, redirect } from '@sveltejs/kit'
import type { NotificationType, Profile, UserRole } from '$lib/types'

const ROLE_LEVEL: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  owner: 3
}

export async function requireUser(locals: App.Locals) {
  const { user } = await locals.safeGetSession()

  if (!user) {
    throw redirect(303, '/login')
  }

  return user
}

export async function getAuthenticatedProfile(locals: App.Locals) {
  const user = await requireUser(locals)
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw error(403, 'Via profilo ne estas disponebla')
  }

  return { user, profile: profile as Profile }
}

export function hasRequiredRole(role: UserRole, minimumRole: UserRole) {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minimumRole]
}

export async function requireRole(locals: App.Locals, minimumRole: UserRole) {
  const { user, profile } = await getAuthenticatedProfile(locals)

  if (!hasRequiredRole(profile.role, minimumRole)) {
    throw error(403, 'Vi ne havas aliron al ĉi tiu paĝo')
  }

  return { user, profile }
}

export async function requireStaff(locals: App.Locals) {
  return requireRole(locals, 'moderator')
}

export async function requireAdmin(locals: App.Locals) {
  return requireRole(locals, 'admin')
}

export async function requireOwner(locals: App.Locals) {
  return requireRole(locals, 'owner')
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

  if (input.type === 'message') {
    const { data: existing } = await locals.supabase
      .from('notifications')
      .select('id')
      .eq('user_id', input.user_id)
      .eq('actor_id', input.actor_id)
      .eq('type', 'message')
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (existing && existing.length > 0) {
      const [latest, ...duplicates] = existing

      await locals.supabase
        .from('notifications')
        .update({
          message: input.message ?? '',
          is_read: false,
          created_at: new Date().toISOString()
        })
        .eq('id', latest.id)

      if (duplicates.length > 0) {
        await locals.supabase
          .from('notifications')
          .delete()
          .in(
            'id',
            duplicates.map((notification) => notification.id)
          )
      }

      return
    }
  }

  await locals.supabase.from('notifications').insert({
    user_id: input.user_id,
    actor_id: input.actor_id,
    type: input.type,
    post_id: input.post_id ?? null,
    comment_id: input.comment_id ?? null,
    message: input.message ?? ''
  })
}
