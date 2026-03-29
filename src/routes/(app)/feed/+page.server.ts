import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockPosts, mockCategories } from '$lib/mock'
import { uploadPostImages } from '$lib/server/storage'
import { postSchema } from '$lib/validators'
import { applyXSystem } from '$lib/utils'
import { fail } from '@sveltejs/kit'
import { requireUser } from '$lib/server/social'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals, url }) => {
  if (DEMO) return { posts: mockPosts, categories: mockCategories, nextCursor: null }
  const category = url.searchParams.get('category')
  const cursor = url.searchParams.get('cursor')
  const filter = url.searchParams.get('filter') // 'following'
  const { user } = await locals.safeGetSession()

  let query = locals.supabase
    .from('posts')
    .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (category) query = query.eq('category.slug', category)
  if (cursor) query = query.lt('created_at', cursor)

  if (filter === 'following' && user) {
    const { data: follows } = await locals.supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const ids = (follows ?? []).map((f) => f.following_id)
    if (ids.length > 0) {
      query = query.in('user_id', ids)
    } else {
      const { data: cats } = await locals.supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      return { posts: [], categories: cats ?? [], nextCursor: null }
    }
  }

  const [{ data: posts }, { data: categories }] = await Promise.all([
    query,
    locals.supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
  ])

  const nextCursor =
    posts && posts.length === 20 ? posts[posts.length - 1].created_at : null

  return { posts: posts ?? [], categories: categories ?? [], nextCursor }
}

export const actions: Actions = {
  createPost: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const user = await requireUser(locals)
    const formData = await request.formData()
    const raw = {
      content: formData.get('content'),
      category_id: formData.get('category_id')
    }

    const result = postSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors })
    }

    const imageUrls = await uploadPostImages(
      locals,
      user.id,
      formData.getAll('images').filter((value): value is File => value instanceof File)
    )

    const { error } = await locals.supabase
      .from('posts')
      .insert({
        user_id: user.id,
        category_id: result.data.category_id,
        content: applyXSystem(result.data.content.trim()),
        image_urls: imageUrls
      })

    if (error) {
      return fail(500, { message: error?.message ?? 'Failed to create post' })
    }

    return { success: true }
  }
}
