import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockPosts, mockCategories } from '$lib/mock'
import { uploadPostImages } from '$lib/server/storage'
import { postSchema } from '$lib/validators'
import { applyXSystem } from '$lib/utils'
import { error, fail } from '@sveltejs/kit'
import { requireUser } from '$lib/server/social'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ params, locals }) => {
  if (DEMO) {
    const category = mockCategories.find((c) => c.slug === params.slug)
    if (!category) throw error(404, 'Kategorio ne trovita')
    const posts = mockPosts.filter((p) => p.category?.slug === params.slug)
    return { category, posts, categories: mockCategories }
  }

  const [{ data: category }, { data: allCategories }] = await Promise.all([
    locals.supabase.from('categories').select('*').eq('slug', params.slug).single(),
    locals.supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
  ])

  if (!category) throw error(404, 'Kategorio ne trovita')

  const { data: posts } = await locals.supabase
    .from('posts')
    .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
    .eq('category_id', category.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const { user } = await locals.safeGetSession()
  const postIds = (posts ?? []).map((post) => post.id)
  let likedPostIds = new Set<string>()

  if (user && postIds.length > 0) {
    const { data: likes } = await locals.supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    likedPostIds = new Set((likes ?? []).map((like) => like.post_id))
  }

  return {
    category,
    posts: (posts ?? []).map((post) => ({ ...post, user_liked: likedPostIds.has(post.id) })),
    categories: allCategories ?? []
  }
}

export const actions: Actions = {
  createPost: async ({ request, locals, params }) => {
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

    const { error: insertError } = await locals.supabase
      .from('posts')
      .insert({
        user_id: user.id,
        category_id: result.data.category_id,
        content: applyXSystem(result.data.content.trim()),
        image_urls: imageUrls
      })

    if (insertError) {
      return fail(500, { message: insertError?.message ?? 'Failed to create post' })
    }

    return { success: true }
  }
}
