import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { Heart, MessageSquare, TriangleAlert, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { queryKeys } from '@/lib/query/keys'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/lib/icons'
import PostComposer from '@/components/PostComposer'
import PostMedia from '@/components/PostMedia'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { TimelineSkeleton } from '@/components/ui/TimelineSkeleton'
import type { Post, Category } from '@/lib/types'
import { feedWithFilter, routes } from '@/lib/routes'
import { updatePostLikeInData } from '@/lib/query/optimisticPosts'

const BETA_KEY = 'verdkomunumo-beta-notice-dismissed'
const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Verdkomunumo'

export default function FeedPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const profile = useAuthStore(s => s.profile)
  const toast = useToastStore()
  const [searchParams] = useSearchParams()
  const [showBeta, setShowBeta] = useState(false)
  const filter = searchParams.get('filter') === 'following' ? 'following' : 'all'

  useEffect(() => {
    setShowBeta(localStorage.getItem(BETA_KEY) !== 'true')
  }, [])

  function dismissBeta() {
    setShowBeta(false)
    localStorage.setItem(BETA_KEY, 'true')
  }

  const { data: feedData, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.feed({ filter }),
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey(id,username,display_name,avatar_url),
          category:categories(id,slug,name),
          likes:likes(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'following' && profile) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', profile.id)
        const ids = (follows ?? []).map((f: any) => f.following_id)
        if (ids.length === 0) return { posts: [], categories: [] }
        query = query.in('user_id', ids)
      }

      const [postsRes, catsRes] = await Promise.all([
        query,
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      ])

      const posts = (postsRes.data ?? []).map((p: any) => ({
        ...p,
        user_liked: (p.likes ?? []).some((l: any) => l.user_id === profile?.id),
        likes_count: p.likes?.length ?? 0,
      }))

      return { posts, categories: catsRes.data ?? [] }
    },
  })

  const likeMutation = useMutation({
    mutationFn: async (post: Post) => {
      if (!profile) throw new Error('Not authenticated')
      if (post.user_liked) {
        await supabase.from('likes').delete()
          .eq('post_id', post.id).eq('user_id', profile.id)
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: profile.id })
      }
    },
    onMutate: async (post) => {
      const queryKey = queryKeys.feed({ filter })
      await queryClient.cancelQueries({ queryKey })
      const previousFeed = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (current: unknown) => updatePostLikeInData(current, post.id))

      return { previousFeed, queryKey }
    },
    onError: (_error, _post, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(context.queryKey, context.previousFeed)
      }
      toast.error(t('toast_action_failed'))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed() }),
  })

  const posts: Post[] = (feedData as any)?.posts ?? []
  const categories: Category[] = (feedData as any)?.categories ?? []

  return (
    <>
      <Helmet><title>{t('feed_title')} — {APP_NAME}</title></Helmet>

      <div className="page-header">
        <h1>{t('feed_title')}</h1>
        <nav className="tabs">
          <Link className={`tab${filter === 'all' ? ' active' : ''}`} to={feedWithFilter('all')}>
            {t('feed_all')}
          </Link>
          <Link className={`tab${filter === 'following' ? ' active' : ''}`} to={feedWithFilter('following')}>
            {t('feed_following')}
          </Link>
          {isFetching && !isLoading && (
            <span className="refreshing" aria-live="polite">
              <InlineSpinner size={12} />
              <span>{t('messages_sending')}</span>
            </span>
          )}
        </nav>
      </div>

      {showBeta && (
        <aside className="beta-banner" role="status" aria-live="polite">
          <div className="beta-icon"><TriangleAlert size={24} strokeWidth={2.15} /></div>
          <div className="beta-copy">
            <strong>{t('beta_banner_title')}</strong>
            <span>{t('beta_banner_body')}</span>
          </div>
          <button type="button" className="beta-close" onClick={dismissBeta} aria-label={t('beta_banner_close')}>
            <X size={18} strokeWidth={2.15} />
          </button>
        </aside>
      )}

      <PostComposer categories={categories} />

      {isLoading ? (
        <TimelineSkeleton items={4} />
      ) : posts.length === 0 ? (
        <p className="empty">{t('feed_empty')}</p>
      ) : (
        <div className="timeline">
          {posts.map(post => {
            const likePending = likeMutation.isPending && likeMutation.variables?.id === post.id
            return (
            <article key={post.id} className="entry">
              <div className="left">
                {post.author && (
                  <Link to={routes.profile(post.author.username)} className="ava-wrap">
                    <img
                      src={getAvatarUrl(post.author.avatar_url, post.author.display_name)}
                      alt={post.author.display_name}
                      className="ava"
                    />
                  </Link>
                )}
              </div>
              <div className="right">
                <div className="meta">
                  {post.author && (
                    <>
                      <Link to={routes.profile(post.author.username)} className="display-name">{post.author.display_name}</Link>
                      <span className="username">@{post.author.username}</span>
                      <span className="dot-sep">·</span>
                      <span className="time">{formatDate(post.created_at)}</span>
                    </>
                  )}
                  {post.category && (
                    <Link
                      to={routes.category(post.category.slug)}
                      className="cat-tag"
                      style={{ color: CATEGORY_COLORS[post.category.slug], background: `${CATEGORY_COLORS[post.category.slug]}15` }}
                    >
                      {t(`cat_name_${post.category.slug}` as any)}
                    </Link>
                  )}
                </div>
                <Link to={routes.post(post.id)} className="body">
                  <p className="content">{post.content}</p>
                </Link>
                {!!post.image_urls?.length && (
                  <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />
                )}
                <div className="actions">
                  <button
                    type="button"
                    className={`act${post.user_liked ? ' liked' : ''}`}
                    onClick={() => likeMutation.mutate(post)}
                    disabled={likePending}
                    aria-busy={likePending}
                  >
                    {likePending ? <InlineSpinner size={14} /> : <Heart size={14} strokeWidth={1.75} />} <span>{post.likes_count}</span>
                  </button>
                  <Link to={routes.post(post.id)} className="act">
                    <MessageSquare size={14} strokeWidth={1.75} /> <span>{post.comments_count}</span>
                  </Link>
                </div>
              </div>
            </article>
            )
          })}
        </div>
      )}

      <style>{`
        .page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0.1rem; }
        .page-header h1 { font-size: 1.1rem; font-weight: 700; color: var(--color-text); margin: 0; }
        .tabs { display: flex; gap: 0.1rem; }
        .refreshing { display: inline-flex; align-items: center; gap: 0.35rem; margin-left: 0.4rem; padding: 0.32rem 0.55rem; border-radius: 999px; font-size: 0.72rem; color: var(--color-primary); background: var(--color-primary-dim); white-space: nowrap; }
        .tab { background: none; border: none; padding: 0.4rem 0.75rem; font-size: 0.84rem; font-weight: 500; color: var(--color-text-muted); cursor: pointer; border-radius: 6px; font-family: inherit; transition: color 0.12s, background 0.12s; text-decoration: none; }
        .tab:hover { color: var(--color-text); }
        .tab.active { color: var(--color-primary); background: var(--color-primary-dim); }
        .beta-banner { display: flex; align-items: flex-start; gap: 0.75rem; background: #fefce8; border: 1px solid #fde047; border-radius: 10px; padding: 0.85rem 1rem; margin: 0.75rem 0; }
        .beta-icon { color: #ca8a04; flex-shrink: 0; margin-top: 1px; }
        .beta-copy { flex: 1; font-size: 0.84rem; line-height: 1.5; color: #78350f; display: flex; flex-direction: column; gap: 0.2rem; }
        .beta-copy strong { font-weight: 700; }
        .beta-close { background: none; border: none; color: #ca8a04; cursor: pointer; padding: 0.1rem; border-radius: 4px; flex-shrink: 0; display: flex; }
        .beta-close:hover { color: #92400e; }
        .empty { text-align: center; padding: 3rem 0; color: var(--color-text-muted); font-size: 0.875rem; }
        .timeline { display: flex; flex-direction: column; }
        .entry { display: flex; gap: 0.85rem; padding: 1rem 0; border-bottom: 1px solid var(--color-border); }
        .entry:first-child { border-top: 1px solid var(--color-border); }
        .left { flex-shrink: 0; }
        .ava-wrap { display: block; text-decoration: none; }
        .ava { width: 38px; height: 38px; border-radius: 99px; object-fit: cover; display: block; transition: opacity 0.15s; }
        .ava-wrap:hover .ava { opacity: 0.8; }
        .right { flex: 1; min-width: 0; }
        .meta { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.35rem; font-size: 0.84rem; }
        .display-name { font-weight: 600; color: var(--color-text); text-decoration: none; }
        .display-name:hover { text-decoration: underline; }
        .username { color: var(--color-text-muted); }
        .dot-sep { color: var(--color-text-muted); }
        .time { color: var(--color-text-muted); font-size: 0.8rem; }
        .cat-tag { margin-left: auto; font-size: 0.7rem; padding: 0.1rem 0.45rem; border-radius: 99px; font-weight: 500; text-decoration: none; flex-shrink: 0; white-space: nowrap; }
        .body { text-decoration: none; display: block; }
        .content { font-size: 0.9375rem; line-height: 1.6; color: var(--color-text); margin: 0 0 0.65rem; white-space: pre-wrap; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 6; line-clamp: 6; -webkit-box-orient: vertical; }
        .actions { display: flex; gap: 0.15rem; align-items: center; }
        .act { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.5rem; background: transparent; border: none; font-size: 0.8rem; color: var(--color-text-muted); border-radius: 5px; cursor: pointer; transition: color 0.12s, background 0.12s; text-decoration: none; font-family: inherit; }
        .act:hover { color: var(--color-primary); background: var(--color-primary-dim); }
        .act:disabled { opacity: 0.7; cursor: wait; }
        button.act.liked { color: #e11d48; background: #f43f5e18; }
        .act span { font-variant-numeric: tabular-nums; }
      `}</style>
    </>
  )
}
