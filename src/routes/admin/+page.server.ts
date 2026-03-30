import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { fail } from '@sveltejs/kit'
import { mockCategories, mockPosts, mockProfile } from '$lib/mock'
import { requireOwner, requireStaff } from '$lib/server/social'
import type { UserRole } from '$lib/types'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'
const MANAGEABLE_ROLES: UserRole[] = ['user', 'moderator', 'admin', 'owner']

export const load: PageServerLoad = async ({ locals, url }) => {
  const query = url.searchParams.get('q')?.trim() ?? ''
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
  const pageSize = 20
  const roleFilter = (url.searchParams.get('role')?.trim() as UserRole | 'all' | null) ?? 'all'
  const normalizedRoleFilter = roleFilter === 'all' || MANAGEABLE_ROLES.includes(roleFilter) ? roleFilter : 'all'

  if (DEMO) {
    return {
      staffProfile: { ...mockProfile, role: 'owner' },
      isOwner: true,
      filters: {
        query,
        role: normalizedRoleFilter
      },
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 1
      },
      stats: {
        users: 1284,
        categories: mockCategories.length,
        pendingSuggestions: 0
      },
      recentPosts: mockPosts,
      recentUsers: [],
      managedUsers: []
    }
  }

  const { profile } = await requireStaff(locals)
  let managedUsersQuery = locals.supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (normalizedRoleFilter !== 'all') {
    managedUsersQuery = managedUsersQuery.eq('role', normalizedRoleFilter)
  }

  if (query.length >= 2) {
    const escapedQuery = query.replace(/[%_,]/g, (char) => `\\${char}`)
    managedUsersQuery = managedUsersQuery.or(
      `username.ilike.%${escapedQuery}%,display_name.ilike.%${escapedQuery}%,email.ilike.%${escapedQuery}%`
    )
  }

  managedUsersQuery = managedUsersQuery.range((page - 1) * pageSize, page * pageSize - 1)

  const [profilesRes, categoriesRes, suggestionsRes, postsRes, usersRes, managedUsersRes] = await Promise.all([
    locals.supabase.from('profiles').select('id', { count: 'exact', head: true }),
    locals.supabase.from('categories').select('id', { count: 'exact', head: true }),
    locals.supabase
      .from('app_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    locals.supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .order('created_at', { ascending: false })
      .limit(12),
    locals.supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(8),
    managedUsersQuery
  ])

  return {
    staffProfile: profile,
    isOwner: profile.role === 'owner',
    filters: {
      query,
      role: normalizedRoleFilter
    },
    pagination: {
      page,
      pageSize,
      total: managedUsersRes.count ?? 0,
      totalPages: Math.max(1, Math.ceil((managedUsersRes.count ?? 0) / pageSize))
    },
    stats: {
      users: profilesRes.count ?? 0,
      categories: categoriesRes.count ?? 0,
      pendingSuggestions: suggestionsRes.count ?? 0
    },
    recentPosts: postsRes.data ?? [],
    recentUsers: usersRes.data ?? [],
    managedUsers: managedUsersRes.data ?? []
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
  },

  updateUserRole: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireOwner(locals)
    const formData = await request.formData()
    const userId = formData.get('user_id')?.toString()
    const role = formData.get('role')?.toString() as UserRole | undefined

    if (!userId || !role) return fail(400, { message: 'Missing role update payload' })
    if (!MANAGEABLE_ROLES.includes(role)) return fail(400, { message: 'Invalid role' })
    if (userId === user.id) return fail(400, { message: 'You cannot change your own role from the panel.' })

    const { data: targetProfile, error: targetError } = await locals.supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (targetError || !targetProfile) {
      return fail(404, { message: 'User not found' })
    }

    if (targetProfile.role === 'owner' && role !== 'owner') {
      const { count: ownersCount } = await locals.supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner')

      if ((ownersCount ?? 0) <= 1) {
        return fail(400, { message: 'At least one owner must remain in the system.' })
      }
    }

    const { error } = await locals.supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return fail(500, { message: error.message })

    return { success: true, message: `Role updated to ${role}.` }
  }
}
