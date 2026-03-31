import type { ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query/keys'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { formatDate, truncate } from '@/lib/utils'
import type { AppSuggestion, ContentReport, Post, Comment } from '@/lib/types'
import { routes } from '@/lib/routes'
import { Link } from 'react-router-dom'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { InlineSpinner } from '@/components/ui/InlineSpinner'

async function fetchAdminReports() {
  const [reportsRes, hiddenPostsRes, hiddenCommentsRes, suggestionsRes] = await Promise.all([
    supabase
      .from('content_reports')
      .select('*, author:profiles!user_id(*), post:posts!post_id(*, author:profiles!user_id(*), category:categories!category_id(*)), comment:comments!comment_id(*, author:profiles!user_id(*), post:posts!post_id(id, content))')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .eq('is_deleted', true)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('comments')
      .select('*, author:profiles!user_id(*), post:posts!post_id(id, content)')
      .eq('is_deleted', true)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('app_suggestions')
      .select('*, author:profiles!user_id(*)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return {
    contentReports: (reportsRes.data ?? []) as ContentReport[],
    hiddenPosts: (hiddenPostsRes.data ?? []) as Post[],
    hiddenComments: (hiddenCommentsRes.data ?? []) as Comment[],
    appSuggestions: (suggestionsRes.data ?? []) as AppSuggestion[],
  }
}

export default function AdminReportsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const toast = useToastStore()
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.adminReports(),
    queryFn: fetchAdminReports,
  })

  const actionMutation = useMutation({
    mutationFn: async (payload: { kind: string; id: string; reportId?: string }) => {
      const now = new Date().toISOString()
      switch (payload.kind) {
        case 'hide-post': {
          const { error } = await supabase.from('posts').update({ is_deleted: true, updated_at: now }).eq('id', payload.id)
          if (error) throw error
          if (payload.reportId && user) {
            await supabase.from('content_reports').update({
              status: 'resolved',
              reviewed_by: user.id,
              reviewed_at: now,
              resolution_note: 'Post hidden by moderator.',
            }).eq('id', payload.reportId)
          }
          return
        }
        case 'hide-comment': {
          const { error } = await supabase.from('comments').update({ is_deleted: true }).eq('id', payload.id)
          if (error) throw error
          if (payload.reportId && user) {
            await supabase.from('content_reports').update({
              status: 'resolved',
              reviewed_by: user.id,
              reviewed_at: now,
              resolution_note: 'Comment hidden by moderator.',
            }).eq('id', payload.reportId)
          }
          return
        }
        case 'dismiss-report': {
          if (!user) throw new Error('Ne ensalutinta')
          const { error } = await supabase.from('content_reports').update({
            status: 'dismissed',
            reviewed_by: user.id,
            reviewed_at: now,
            resolution_note: 'Report dismissed by moderator.',
          }).eq('id', payload.id)
          if (error) throw error
          return
        }
        case 'restore-post': {
          const { error } = await supabase.from('posts').update({ is_deleted: false, updated_at: now }).eq('id', payload.id)
          if (error) throw error
          return
        }
        case 'restore-comment': {
          const { error } = await supabase.from('comments').update({ is_deleted: false }).eq('id', payload.id)
          if (error) throw error
          return
        }
        case 'plan-suggestion':
        case 'close-suggestion': {
          if (!user) throw new Error('Ne ensalutinta')
          const { error } = await supabase.from('app_suggestions').update({
            status: payload.kind === 'plan-suggestion' ? 'planned' : 'closed',
            reviewed_by: user.id,
            reviewed_at: now,
          }).eq('id', payload.id)
          if (error) throw error
          return
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminReports() })
    },
    onError: (error) => toast.error(error.message),
  })

  const reports = data?.contentReports ?? []
  const hiddenPosts = data?.hiddenPosts ?? []
  const hiddenComments = data?.hiddenComments ?? []
  const suggestions = data?.appSuggestions ?? []

  return (
    <>
      <Helmet><title>{t('admin_nav_reports')} — Verdkomunumo</title></Helmet>
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[var(--color-text)]">{t('admin_nav_reports')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Review actual user-submitted reports, resolve them, and restore moderated content when needed.
          </p>
        </div>
        {isFetching && <InlineSpinner size={13} className="text-[var(--color-primary)]" />}
      </div>

      {isLoading ? (
        <ListSkeleton items={6} avatarSize={12} />
      ) : (
        <div className="grid gap-8">
          <AdminSection title="Open reports" empty="No pending reports right now.">
            {reports.map((report) => (
              <article key={report.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[rgba(220,38,38,0.12)] px-2 py-1 text-xs font-bold uppercase text-[#b91c1c]">{report.reason}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {report.post_id ? 'Post' : 'Comment'} reported by @{report.author?.username ?? 'unknown'}
                    </span>
                    <span className="text-sm text-[var(--color-text-muted)]">{formatDate(report.created_at)}</span>
                  </div>
                  {report.post ? (
                    <>
                      <Link to={routes.post(report.post.id)} className="block text-[var(--color-text)] no-underline hover:underline">
                        {truncate(report.post.content, 220)}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        @{report.post.author?.username ?? 'unknown'} · {report.post.category?.name ?? 'No category'}
                      </p>
                    </>
                  ) : report.comment ? (
                    <>
                      <p className="text-[var(--color-text)]">{truncate(report.comment.content, 220)}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        @{report.comment.author?.username ?? 'unknown'} · on post #{report.comment.post?.id}
                      </p>
                    </>
                  ) : null}
                  {report.details && <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-text)]">{report.details}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.post_id && (
                    <button type="button" className="rounded-xl border border-[#dc2626] px-3 py-2 text-[#dc2626]" onClick={() => actionMutation.mutate({ kind: 'hide-post', id: report.post_id!, reportId: report.id })}>
                      Hide post
                    </button>
                  )}
                  {report.comment_id && (
                    <button type="button" className="rounded-xl border border-[#dc2626] px-3 py-2 text-[#dc2626]" onClick={() => actionMutation.mutate({ kind: 'hide-comment', id: report.comment_id!, reportId: report.id })}>
                      Hide comment
                    </button>
                  )}
                  <button type="button" className="rounded-xl border border-[var(--color-border)] px-3 py-2" onClick={() => actionMutation.mutate({ kind: 'dismiss-report', id: report.id })}>
                    Dismiss
                  </button>
                </div>
              </article>
            ))}
          </AdminSection>

          <AdminSection title="Product suggestions" empty="There are no product suggestions yet.">
            {suggestions.map((suggestion) => (
              <article key={suggestion.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text)]">{suggestion.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    @{suggestion.author?.username ?? 'unknown'} · {formatDate(suggestion.created_at)} · {suggestion.status}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-text)]">{suggestion.description}</p>
                  {suggestion.context && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{suggestion.context}</p>}
                </div>
                {suggestion.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-white" onClick={() => actionMutation.mutate({ kind: 'plan-suggestion', id: suggestion.id })}>
                      Plan
                    </button>
                    <button type="button" className="rounded-xl border border-[var(--color-border)] px-3 py-2" onClick={() => actionMutation.mutate({ kind: 'close-suggestion', id: suggestion.id })}>
                      Close
                    </button>
                  </div>
                )}
              </article>
            ))}
          </AdminSection>

          <AdminSection title="Hidden posts" empty="No hidden posts.">
            {hiddenPosts.map((post) => (
              <article key={post.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link to={routes.post(post.id)} className="text-[var(--color-text)] no-underline hover:underline">
                    {truncate(post.content, 180)}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">@{post.author?.username ?? 'unknown'} · {formatDate(post.updated_at ?? post.created_at)}</p>
                </div>
                <button type="button" className="rounded-xl border border-[var(--color-border)] px-3 py-2" onClick={() => actionMutation.mutate({ kind: 'restore-post', id: post.id })}>
                  Restore
                </button>
              </article>
            ))}
          </AdminSection>

          <AdminSection title="Hidden comments" empty="No hidden comments.">
            {hiddenComments.map((comment) => (
              <article key={comment.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[var(--color-text)]">{truncate(comment.content, 180)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">@{comment.author?.username ?? 'unknown'} · {formatDate(comment.created_at)}</p>
                </div>
                <button type="button" className="rounded-xl border border-[var(--color-border)] px-3 py-2" onClick={() => actionMutation.mutate({ kind: 'restore-comment', id: comment.id })}>
                  Restore
                </button>
              </article>
            ))}
          </AdminSection>
        </div>
      )}
    </>
  )
}

function AdminSection({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: ReactNode
}) {
  const items = Array.isArray(children) ? children : [children]
  const hasContent = items.some(Boolean)

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">{title}</h2>
      {hasContent ? <div className="grid gap-3">{children}</div> : <p className="text-sm text-[var(--color-text-muted)]">{empty}</p>}
    </section>
  )
}
