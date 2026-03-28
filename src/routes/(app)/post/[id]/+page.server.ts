import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockPosts, mockComments } from '$lib/mock'
import { commentSchema } from '$lib/validators'
import { applyXSystem } from '$lib/utils'
import { createNotification, requireUser } from '$lib/server/social'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

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

    throw redirect(303, `/post/${params.id}#comments`)
  },

  toggleLike: async ({ request, locals, params }) => {
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

    const referer = request.headers.get('referer')
    const destination =
      referer && referer.startsWith('http')
        ? new URL(referer).pathname + new URL(referer).search + new URL(referer).hash
        : `/post/${params.id}`

    throw redirect(303, destination)
  }
}
