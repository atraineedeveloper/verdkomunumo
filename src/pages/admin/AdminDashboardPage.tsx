import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, Users, Flag, Heart, MessageSquare, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { RoleManagerSection } from './dashboard/RoleManagerSection'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { queryKeys } from '@/lib/query/keys'
import { getPaginationRange, normalizeAdminRoleFilter } from '@/lib/admin/utils'
import { formatDate, hasRequiredRole } from '@/lib/utils'
import { CATEGORY_COLORS, CATEGORY_ICONS, LEVEL_COLORS, LEVEL_ICONS } from '@/lib/icons'
import { routes } from '@/lib/routes'
import type { Profile, UserRole } from '@/lib/types'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { InlineSpinner } from '@/components/ui/InlineSpinner'

const roleOptions: UserRole[] = ['user', 'moderator', 'admin', 'owner']

interface ManagedUser extends Profile {
  role: UserRole
  updated_at: string
  created_at: string
}

async function fetchAdminDashboard({
  query,
  role,
  page,
  pageSize,
}: {
  query: string
  role: UserRole | 'all'
  page: number
  pageSize: number
}) {
  let managedUsersQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (role !== 'all') managedUsersQuery = managedUsersQuery.eq('role', role)
  if (query.length >= 2) {
    managedUsersQuery = managedUsersQuery.or(
      `username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`,
    )
  }

  managedUsersQuery = managedUsersQuery.range((page - 1) * pageSize, page * pageSize - 1)

  const [profilesRes, categoriesRes, suggestionsRes, postsRes, usersRes, managedUsersRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('app_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(8),
    managedUsersQuery,
  ])

  return {
    stats: {
      users: profilesRes.count ?? 0,
      categories: categoriesRes.count ?? 0,
      pendingSuggestions: suggestionsRes.count ?? 0,
    },
    recentPosts: postsRes.data ?? [],
    recentUsers: (usersRes.data ?? []) as ManagedUser[],
    managedUsers: (managedUsersRes.data ?? []) as ManagedUser[],
    totalManagedUsers: managedUsersRes.count ?? 0,
  }
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q')?.trim() ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const pageSize = 20
  const roleFilter = normalizeAdminRoleFilter(searchParams.get('role'))
  const isOwner = profile ? hasRequiredRole(profile.role, 'owner') : false

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.adminDashboard({ query, roleFilter, page }),
    queryFn: () => fetchAdminDashboard({ query, role: roleFilter, page, pageSize }),
  })

  const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const params = new URLSearchParams(searchParams)
    const nextQuery = String(form.get('q') ?? '').trim()
    const nextRole = String(form.get('role') ?? 'all')
    if (nextQuery) {
      params.set('q', nextQuery)
    } else {
      params.delete('q')
    }
    if (nextRole !== 'all') {
      params.set('role', nextRole)
    } else {
      params.delete('role')
    }
    params.delete('page') // Reset to page 1 on new filter
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', postId)
      if (error) throw error
    },
    onSuccess: async () => {
      toast.success(t('admin_delete'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard() })
    },
    onError: (error) => toast.error(error.message),
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: async () => {
      toast.success(t('settings_save'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard() })
    },
    onError: (error) => toast.error(error.message),
  })

  const handleRoleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    updateRoleMutation.mutate({
      userId: String(form.get('user_id')),
      role: String(form.get('role')) as UserRole,
    })
  }

  const pagination = useMemo(
    () => getPaginationRange(page, pageSize, data?.totalManagedUsers ?? 0),
    [page, pageSize, data?.totalManagedUsers],
  )

  const stats = [
    { label: t('admin_users'), value: data?.stats.users ?? 0, Icon: Users },
    { label: t('nav_categories'), value: data?.stats.categories ?? 0, Icon: Layers },
    { label: t('admin_nav_reports'), value: data?.stats.pendingSuggestions ?? 0, Icon: Flag },
  ]

  return (
    <>
      <Helmet><title>{t('admin_panel')} — Verdkomunumo</title></Helmet>

      <div className="mb-6">
        <h1 className="m-0 text-2xl font-bold text-[var(--color-text)]">{t('admin_panel')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t('admin_welcome')} {profile?.display_name ?? 'Admin'}
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="mb-3 inline-flex rounded-xl bg-[var(--color-primary-dim)] p-3 text-[var(--color-primary)]">
              <Icon size={22} strokeWidth={1.7} />
            </div>
            <div className="text-3xl font-bold text-[var(--color-text)]">{value}</div>
            <div className="mt-1 text-sm text-[var(--color-text-muted)]">{label}</div>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="m-0 text-base font-semibold text-[var(--color-text)]">{t('admin_recent_posts')}</h2>
          {isFetching && <InlineSpinner size={13} className="text-[var(--color-primary)]" />}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {isLoading ? (
            <div className="p-4"><ListSkeleton items={4} avatarSize={32} /></div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3">Aŭtoro</th>
                  <th className="px-4 py-3">{t('nav_categories')}</th>
                  <th className="px-4 py-3"><Heart size={13} strokeWidth={1.75} /></th>
                  <th className="px-4 py-3"><MessageSquare size={13} strokeWidth={1.75} /></th>
                  <th className="px-4 py-3">Agoj</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentPosts ?? []).map((post: any) => {
                  const CatIcon = post.category ? CATEGORY_ICONS[post.category.slug] : null
                  const catColor = post.category ? CATEGORY_COLORS[post.category.slug] : undefined
                  const deleting = deletePostMutation.isPending && deletePostMutation.variables === post.id
                  return (
                    <tr key={post.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className="px-4 py-3">
                        <Link to={routes.profile(post.author?.username)} className="text-[var(--color-text)] no-underline hover:underline">
                          {post.author?.display_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {post.category && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                            style={{ color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}30` }}
                          >
                            {CatIcon && <CatIcon size={12} strokeWidth={2} />}
                            {t(`cat_name_${post.category.slug}` as never)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{post.likes_count}</td>
                      <td className="px-4 py-3">{post.comments_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link to={routes.post(post.id)} className="text-[var(--color-primary)] no-underline hover:underline">
                            {t('admin_view')}
                          </Link>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[var(--color-danger)]"
                            onClick={() => deletePostMutation.mutate(post.id)}
                            disabled={deleting}
                          >
                            {deleting ? <InlineSpinner size={12} /> : null}
                            {t('admin_delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <RoleManagerSection
        managedUsers={data?.managedUsers ?? []}
        isLoading={isLoading}
        isOwner={isOwner}
        profileId={profile?.id}
        query={query}
        roleFilter={roleFilter}
        roleOptions={roleOptions}
        pagination={pagination}
        page={page}
        totalManagedUsers={data?.totalManagedUsers ?? 0}
        updateRoleMutationVariables={updateRoleMutation.variables}
        isUpdatingRole={updateRoleMutation.isPending}
        onFilterSubmit={handleFilterSubmit}
        onRoleUpdate={handleRoleUpdate}
        onPageChange={handlePageChange}
      />

      <section>
        <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">{t('admin_new_users')}</h2>
        <div className="grid gap-3">
          {(data?.recentUsers ?? []).map((recentUser) => {
            const LevelIcon = LEVEL_ICONS[recentUser.esperanto_level]
            return (
              <div key={recentUser.id} className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <span style={{ color: LEVEL_COLORS[recentUser.esperanto_level] }}>
                  {LevelIcon && <LevelIcon size={18} strokeWidth={1.75} />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={routes.profile(recentUser.username)} className="text-[var(--color-text)] no-underline hover:underline">
                    {recentUser.display_name}
                  </Link>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    @{recentUser.username} · {formatDate(recentUser.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
