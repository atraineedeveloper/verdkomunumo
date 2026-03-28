import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockPosts, mockCategories } from '$lib/mock'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

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

  return { category, posts: posts ?? [], categories: allCategories ?? [] }
}
