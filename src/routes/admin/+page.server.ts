import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { fail } from '@sveltejs/kit'
import { mockCategories, mockPosts, mockProfile } from '$lib/mock'
import { requireStaff } from '$lib/server/social'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) {
    return {
      staffProfile: { ...mockProfile, role: 'admin' },
      stats: {
        users: 1284,
        categories: mockCategories.length,
        pendingSuggestions: 0
      },
      recentPosts: mockPosts,
      recentUsers: []
    }
  }

  await requireStaff(locals)

  const [profilesRes, categoriesRes, suggestionsRes, postsRes, usersRes] = await Promise.all([
    locals.supabase.from('profiles').select('id', { count: 'exact', head: true }),
    locals.supabase.from('categories').select('id', { count: 'exact', head: true }),
    locals.supabase
      .from('category_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    locals.supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .order('created_at', { ascending: false })
      .limit(12),
    locals.supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(8)
  ])

  return {
    stats: {
      users: profilesRes.count ?? 0,
      categories: categoriesRes.count ?? 0,
      pendingSuggestions: suggestionsRes.count ?? 0
    },
    recentPosts: postsRes.data ?? [],
    recentUsers: usersRes.data ?? []
  }
}

export const actions: Actions = {
  deletePost: async ({ request, locals }) => {
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
  }
}
