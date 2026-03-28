import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockPosts, mockComments } from '$lib/mock'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ params, locals }) => {
  if (DEMO) {
    const post = mockPosts.find((p) => p.id === params.id)
    if (!post) throw error(404, 'Afiŝo ne trovita')
    const comments = mockComments.filter((c) => c.post_id === params.id)
    return { post, comments }
  }

  const { data: post } = await locals.supabase
    .from('posts')
    .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single()

  if (!post) throw error(404, 'Afiŝo ne trovita')

  const { data: comments } = await locals.supabase
    .from('comments')
    .select('*, author:profiles!user_id(*)')
    .eq('post_id', params.id)
    .eq('is_deleted', false)
    .order('created_at')

  return { post, comments: comments ?? [] }
}
