import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { fail } from '@sveltejs/kit'
import { requireStaff } from '$lib/server/social'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) {
    return {
      contentReports: [],
      hiddenPosts: [],
      hiddenComments: [],
      appSuggestions: []
    }
  }

  await requireStaff(locals)

  const [reportsRes, hiddenPostsRes, hiddenCommentsRes, suggestionsRes] = await Promise.all([
    locals.supabase
      .from('content_reports')
      .select(
        '*, author:profiles!user_id(*), post:posts!post_id(*, author:profiles!user_id(*), category:categories!category_id(*)), comment:comments!comment_id(*, author:profiles!user_id(*), post:posts!post_id(id, content))'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(30),
    locals.supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .eq('is_deleted', true)
      .order('created_at', { ascending: false })
      .limit(12),
    locals.supabase
      .from('comments')
      .select('*, author:profiles!user_id(*), post:posts!post_id(id, content)')
      .eq('is_deleted', true)
      .order('created_at', { ascending: false })
      .limit(12),
    locals.supabase
      .from('app_suggestions')
      .select('*, author:profiles!user_id(*)')
      .order('created_at', { ascending: false })
      .limit(30)
  ])

  return {
    contentReports: reportsRes.data ?? [],
    hiddenPosts: hiddenPostsRes.data ?? [],
    hiddenComments: hiddenCommentsRes.data ?? [],
    appSuggestions: suggestionsRes.data ?? []
  }
}

export const actions: Actions = {
  hidePost: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireStaff(locals)
    const formData = await request.formData()
    const postId = formData.get('post_id')?.toString()
    const reportId = formData.get('report_id')?.toString()
    if (!postId) return fail(400, { message: 'Missing post_id' })

    const { error } = await locals.supabase
      .from('posts')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', postId)

    if (error) return fail(500, { message: error.message })

    if (reportId) {
      await locals.supabase
        .from('content_reports')
        .update({
          status: 'resolved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          resolution_note: 'Post hidden by moderator.'
        })
        .eq('id', reportId)
    }

    return { success: true, message: 'Post hidden.' }
  },

  hideComment: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireStaff(locals)
    const formData = await request.formData()
    const commentId = formData.get('comment_id')?.toString()
    const reportId = formData.get('report_id')?.toString()
    if (!commentId) return fail(400, { message: 'Missing comment_id' })

    const { error } = await locals.supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)

    if (error) return fail(500, { message: error.message })

    if (reportId) {
      await locals.supabase
        .from('content_reports')
        .update({
          status: 'resolved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          resolution_note: 'Comment hidden by moderator.'
        })
        .eq('id', reportId)
    }

    return { success: true, message: 'Comment hidden.' }
  },

  dismissReport: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireStaff(locals)
    const formData = await request.formData()
    const reportId = formData.get('report_id')?.toString()
    if (!reportId) return fail(400, { message: 'Missing report_id' })

    const { error } = await locals.supabase
      .from('content_reports')
      .update({
        status: 'dismissed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        resolution_note: 'Report dismissed by moderator.'
      })
      .eq('id', reportId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Report dismissed.' }
  },

  restorePost: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireStaff(locals)
    const formData = await request.formData()
    const postId = formData.get('post_id')?.toString()
    if (!postId) return fail(400, { message: 'Missing post_id' })

    const { error } = await locals.supabase
      .from('posts')
      .update({ is_deleted: false, updated_at: new Date().toISOString() })
      .eq('id', postId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Post restored.' }
  },

  restoreComment: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireStaff(locals)
    const formData = await request.formData()
    const commentId = formData.get('comment_id')?.toString()
    if (!commentId) return fail(400, { message: 'Missing comment_id' })

    const { error } = await locals.supabase
      .from('comments')
      .update({ is_deleted: false })
      .eq('id', commentId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Comment restored.' }
  },

  planSuggestion: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireStaff(locals)
    const formData = await request.formData()
    const suggestionId = formData.get('suggestion_id')?.toString()
    if (!suggestionId) return fail(400, { message: 'Missing suggestion_id' })

    const { error } = await locals.supabase
      .from('app_suggestions')
      .update({
        status: 'planned',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Sugesto markita kiel planita.' }
  },

  closeSuggestion: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireStaff(locals)
    const formData = await request.formData()
    const suggestionId = formData.get('suggestion_id')?.toString()
    if (!suggestionId) return fail(400, { message: 'Missing suggestion_id' })

    const { error } = await locals.supabase
      .from('app_suggestions')
      .update({
        status: 'closed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Sugesto fermita.' }
  }
}
