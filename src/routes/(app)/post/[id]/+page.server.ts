import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockPosts, mockComments } from '$lib/mock'
import { commentSchema, contentReportSchema } from '$lib/validators'
import { applyXSystem } from '$lib/utils'
import { createNotification, requireUser } from '$lib/server/social'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ params, locals }) => {
  if (DEMO) {
    const post = mockPosts.find((p) => p.id === params.id)
    if (!post) throw error(404, 'Afiŝo ne trovita')
    const comments = mockComments.filter((c) => c.post_id === params.id)
    return { post, comments }
  }

  const { user } = await locals.safeGetSession()
  const { data: post } = await locals.supabase
    .from('posts')
    .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single()

  if (!post) throw error(404, 'Afiŝo ne trovita')

  let userLiked = false
  if (user) {
    const { data: like } = await locals.supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', params.id)
      .maybeSingle()

    userLiked = Boolean(like)
  }

  const { data: comments } = await locals.supabase
    .from('comments')
    .select('*, author:profiles!user_id(*)')
    .eq('post_id', params.id)
    .eq('is_deleted', false)
    .order('created_at')

  return { post: { ...post, user_liked: userLiked }, comments: comments ?? [] }
}

export const actions: Actions = {
  comment: async ({ request, locals, params }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)
    const formData = await request.formData()
    const raw = {
      content: formData.get('content'),
      parent_id: formData.get('parent_id') || undefined
    }

    const result = commentSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors })
    }

    const { data: post, error: postError } = await locals.supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single()

    if (postError || !post) {
      throw error(404, 'Afiŝo ne trovita')
    }

    const { data: comment, error: insertError } = await locals.supabase
      .from('comments')
      .insert({
        post_id: params.id,
        user_id: user.id,
        parent_id: result.data.parent_id ?? null,
        content: applyXSystem(result.data.content.trim())
      })
      .select('id')
      .single()

    if (insertError || !comment) {
      return fail(500, { message: insertError?.message ?? 'Failed to create comment' })
    }

    await createNotification(locals, {
      user_id: post.user_id,
      actor_id: user.id,
      type: 'comment',
      post_id: post.id,
      comment_id: comment.id
    })

    return { success: true }
  },

  toggleLike: async ({ locals, params }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)

    const { data: post, error: postError } = await locals.supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single()

    if (postError || !post) {
      throw error(404, 'Afiŝo ne trovita')
    }

    const { data: existingLike } = await locals.supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', params.id)
      .maybeSingle()

    if (existingLike) {
      const { error: deleteError } = await locals.supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        return fail(500, { message: deleteError.message })
      }
    } else {
      const { error: insertError } = await locals.supabase
        .from('likes')
        .insert({ user_id: user.id, post_id: params.id })

      if (insertError) {
        return fail(500, { message: insertError.message })
      }

      await createNotification(locals, {
        user_id: post.user_id,
        actor_id: user.id,
        type: 'like',
        post_id: post.id
      })
    }

    return { success: true }
  },

  reportPost: async ({ request, locals, params }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)
    const formData = await request.formData()
    const result = contentReportSchema.safeParse({
      post_id: params.id,
      reason: formData.get('reason'),
      details: formData.get('details') || ''
    })

    if (!result.success) {
      return fail(400, { message: result.error.issues[0]?.message ?? 'Invalid report payload' })
    }

    const { error: insertError } = await locals.supabase.from('content_reports').insert({
      user_id: user.id,
      post_id: params.id,
      reason: result.data.reason,
      details: (result.data.details ?? '').trim()
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return fail(400, { message: 'You already reported this post.' })
      }

      return fail(500, { message: insertError.message })
    }

    return { success: true, message: 'Report submitted.' }
  },

  reportComment: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)
    const formData = await request.formData()
    const commentId = formData.get('comment_id')?.toString()

    const result = contentReportSchema.safeParse({
      comment_id: commentId,
      reason: formData.get('reason'),
      details: formData.get('details') || ''
    })

    if (!result.success) {
      return fail(400, { message: result.error.issues[0]?.message ?? 'Invalid report payload' })
    }

    const { error: insertError } = await locals.supabase.from('content_reports').insert({
      user_id: user.id,
      comment_id: commentId,
      reason: result.data.reason,
      details: (result.data.details ?? '').trim()
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return fail(400, { message: 'You already reported this comment.' })
      }

      return fail(500, { message: insertError.message })
    }

    return { success: true, message: 'Report submitted.' }
  }
}
