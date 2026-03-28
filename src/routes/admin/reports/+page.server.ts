import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { fail } from '@sveltejs/kit'
import { requireStaff } from '$lib/server/social'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) {
    return {
      flaggedPosts: [],
      recentComments: []
    }
  }

  await requireStaff(locals)

  const [postsRes, commentsRes] = await Promise.all([
    locals.supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .eq('is_deleted', false)
      .order('comments_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),
    locals.supabase
      .from('comments')
      .select('*, author:profiles!user_id(*), post:posts!post_id(id, content)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(20)
  ])

  return {
    flaggedPosts: postsRes.data ?? [],
    recentComments: commentsRes.data ?? []
  }
}

export const actions: Actions = {
  hidePost: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireStaff(locals)
    const formData = await request.formData()
    const postId = formData.get('post_id')?.toString()
    if (!postId) return fail(400, { message: 'Missing post_id' })

    const { error } = await locals.supabase
      .from('posts')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', postId)

    if (error) return fail(500, { message: error.message })
    return { success: true }
  },

  hideComment: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireStaff(locals)
    const formData = await request.formData()
    const commentId = formData.get('comment_id')?.toString()
    if (!commentId) return fail(400, { message: 'Missing comment_id' })

    const { error } = await locals.supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)

    if (error) return fail(500, { message: error.message })
    return { success: true }
  }
}
