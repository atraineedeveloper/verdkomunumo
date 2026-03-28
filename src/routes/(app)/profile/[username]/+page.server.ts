import { error } from '@sveltejs/kit'
import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockProfile, mockPosts } from '$lib/mock'
import type { PageServerLoad } from './$types'

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

  const { session, user } = await locals.safeGetSession()
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
