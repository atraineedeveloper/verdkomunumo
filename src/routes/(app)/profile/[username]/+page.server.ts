import { createNotification, requireUser } from '$lib/server/social'
import { error, fail } from '@sveltejs/kit'
import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockProfile, mockPosts } from '$lib/mock'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals, params }) => {
  if (DEMO) {
    const isOwn = params.username === mockProfile.username
    const posts = mockPosts.filter((p) => p.user_id === mockProfile.id)
    return { profile: mockProfile, posts, isOwn, isFollowing: false }
  }
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) throw error(404, 'Uzanto ne trovita')

  const { user } = await locals.safeGetSession()
  const isOwn = user?.id === profile.id

  // Verificar si el usuario actual sigue a este perfil
  let isFollowing = false
  if (user && !isOwn) {
    const { data } = await locals.supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!data
  }

  const { data: posts } = await locals.supabase
    .from('posts')
    .select('*, category:categories!category_id(*)')
    .eq('user_id', profile.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return { profile, posts: posts ?? [], isOwn, isFollowing }
}

export const actions: Actions = {
  follow: async ({ locals, params }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('id')
      .eq('username', params.username)
      .single()

    if (!profile) throw error(404, 'Uzanto ne trovita')
    if (profile.id === user.id) return fail(400, { message: 'Cannot follow yourself' })

    const { error: insertError } = await locals.supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: profile.id
      })

    if (insertError) {
      return fail(500, { message: insertError.message })
    }

    await createNotification(locals, {
      user_id: profile.id,
      actor_id: user.id,
      type: 'follow'
    })

    return { success: true }
  },

  unfollow: async ({ locals, params }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('id')
      .eq('username', params.username)
      .single()

    if (!profile) throw error(404, 'Uzanto ne trovita')

    const { error: deleteError } = await locals.supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)

    if (deleteError) {
      return fail(500, { message: deleteError.message })
    }

    return { success: true }
  }
}
