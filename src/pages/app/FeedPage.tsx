import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { Heart, MessageSquare, Pencil, Quote, Trash2, TriangleAlert, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { queryKeys } from '@/lib/query/keys'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import { addPostLike } from '@/lib/likes'
import { CATEGORY_COLORS } from '@/lib/icons'
import { fetchFeedPostsWithFallback, normalizeQuotedPost } from '@/lib/postFeatures'
import PostComposer from '@/components/PostComposer'
import { PostEditCard } from '@/components/PostEditCard'
import PostMedia from '@/components/PostMedia'
import { QuotedPostCard } from '@/components/QuotedPostCard'
import { LinkPreviewCard } from '@/components/LinkPreviewCard'
import { PostExcerpt } from '@/components/PostExcerpt'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { TimelineSkeleton } from '@/components/ui/TimelineSkeleton'
import type { Post, Category } from '@/lib/types'
import { feedWithFilter, routes } from '@/lib/routes'
import { removePostInData, updatePostInData, updatePostLikeInData } from '@/lib/query/optimisticPosts'
import { postSchema } from '@/lib/validators'

const BETA_KEY = 'verdkomunumo-beta-notice-dismissed'
const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Verdkomunumo'
const FEED_PAGE_SIZE = 20

export default function FeedPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const profile = useAuthStore(s => s.profile)
  const toast = useToastStore()
  const [searchParams] = useSearchParams()
  const [showBeta, setShowBeta] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [editedCategoryId, setEditedCategoryId] = useState('')
  const [quotingPost, setQuotingPost] = useState<Post | null>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const filter = searchParams.get('filter') === 'following' ? 'following' : 'all'

  useEffect(() => {
    setShowBeta(localStorage.getItem(BETA_KEY) !== 'true')
  }, [])

  function dismissBeta() {
    setShowBeta(false)
    localStorage.setItem(BETA_KEY, 'true')
  }

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  })

  const {
    data: feedData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: queryKeys.feed({ filter, profileId: profile?.id ?? null }),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let followedIds: string[] | undefined
      if (filter === 'following' && profile) {
        const { data: follows, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', profile.id)

        if (followsError) throw followsError
        followedIds = (follows ?? []).map((f: any) => f.following_id)
        if (followedIds.length === 0) {
          return { posts: [], page: pageParam }
        }
      }

      const postsRes = await fetchFeedPostsWithFallback({
        filterUserIds: followedIds,
        page: pageParam,
        pageSize: FEED_PAGE_SIZE,
      })

      if (postsRes.error) throw postsRes.error

      const posts = (postsRes.data ?? []).map((p: any) => ({
        ...normalizeQuotedPost(p),
        user_liked: (p.likes ?? []).some((l: any) => l.user_id === profile?.id),
        likes_count: p.likes?.length ?? 0,
      }))

      return { posts, page: pageParam }
    },
    getNextPageParam: (lastPage) => (
      lastPage.posts.length === FEED_PAGE_SIZE ? lastPage.page + 1 : undefined
    ),
  })

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void fetchNextPage()
      }
    }, {
      rootMargin: '200px 0px',
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const likeMutation = useMutation({
    mutationFn: async (post: Post) => {
      if (!profile) throw new Error('Not authenticated')
      if (post.user_liked) {
        await supabase.from('likes').delete()
          .eq('post_id', post.id).eq('user_id', profile.id)
      } else {
        await addPostLike(post.id, profile.id)
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

  const editPostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!profile) throw new Error('Not authenticated')
      const parsed = postSchema.parse({
        content: editedContent.trim(),
        category_id: editedCategoryId,
      })
      const nextUpdatedAt = new Date().toISOString()
      const { error } = await supabase
        .from('posts')
        .update({
          content: parsed.content,
          category_id: parsed.category_id,
          is_edited: true,
          updated_at: nextUpdatedAt,
        })
        .eq('id', postId)
        .eq('user_id', profile.id)
      if (error) throw error
      return { postId, ...parsed, updated_at: nextUpdatedAt }
    },
    onMutate: async ({ postId }) => {
      const queryKey = queryKeys.feed({ filter })
      await queryClient.cancelQueries({ queryKey })
      const previousFeed = queryClient.getQueryData(queryKey)
      const nextUpdatedAt = new Date().toISOString()
      queryClient.setQueryData(queryKey, (current: unknown) =>
        updatePostInData(current, postId, {
          content: editedContent.trim(),
          category_id: editedCategoryId,
          is_edited: true,
          updated_at: nextUpdatedAt,
        })
      )
      return { previousFeed, queryKey }
    },
    onSuccess: async (_result, variables) => {
      setEditingPostId(null)
      setEditedContent('')
      setEditedCategoryId('')
      toast.success(t('settings_saved'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(variables.postId) })
      await queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(context.queryKey, context.previousFeed)
      }
      toast.error(error.message || t('toast_action_failed'))
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!profile) throw new Error('Not authenticated')
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', profile.id)
      if (error) throw error
      return { postId }
    },
    onMutate: async ({ postId }) => {
      const queryKey = queryKeys.feed({ filter })
      await queryClient.cancelQueries({ queryKey })
      const previousFeed = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (current: unknown) => removePostInData(current, postId))
      return { previousFeed, queryKey }
    },
    onSuccess: async ({ postId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) })
      await queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(context.queryKey, context.previousFeed)
      }
      toast.error(t('toast_action_failed'))
    },
  })

  const posts: Post[] = feedData?.pages.flatMap((page) => page.posts) ?? []

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

      {profile ? (
        <div ref={composerRef}>
          <PostComposer
            categories={categories}
            quotedPost={quotingPost}
            onQuoteClear={() => setQuotingPost(null)}
          />
        </div>
      ) : (
        <div className="guest-cta">
          <span>{t('feed_guest_cta')}</span>
          <Link to={routes.login} className="guest-cta-btn">{t('nav_login')}</Link>
          <Link to={routes.register} className="guest-cta-btn secondary">{t('nav_register')}</Link>
        </div>
      )}

      {isLoading ? (
        <TimelineSkeleton items={4} />
      ) : error ? (
        <p className="empty">{error instanceof Error ? error.message : t('toast_action_failed')}</p>
      ) : posts.length === 0 ? (
        <p className="empty">{t('feed_empty')}</p>
      ) : (
        <div className="timeline">
          {posts.map(post => {
            const likePending = likeMutation.isPending && likeMutation.variables?.id === post.id
            const isEditing = editingPostId === post.id
            const isOwnPost = profile?.id === post.user_id
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
                {isEditing ? (
                  <PostEditCard
                    categories={categories.map((category) => ({ ...category, name: t(`cat_name_${category.slug}` as any) }))}
                    content={editedContent}
                    categoryId={editedCategoryId}
                    initialContent={post.content}
                    initialCategoryId={post.category_id}
                    pending={editPostMutation.isPending}
                    saveLabel={t('settings_save')}
                    cancelLabel={t('suggestion_cancel')}
                    onContentChange={setEditedContent}
                    onCategoryChange={setEditedCategoryId}
                    onCancel={() => {
                      setEditingPostId(null)
                      setEditedContent('')
                      setEditedCategoryId('')
                    }}
                    onSubmit={() => editPostMutation.mutate({ postId: post.id })}
                  />
                ) : (
                  <div className="body">
                    <PostExcerpt
                      content={post.content}
                      to={routes.post(post.id)}
                      contentClassName="content"
                      linkClassName="read-more"
                      maxLines={6}
                      maxChars={420}
                    />
                  </div>
                )}
                {post.quoted_post && (
                  <QuotedPostCard post={post.quoted_post} />
                )}
                {post.link_preview && (
                  <LinkPreviewCard preview={post.link_preview} />
                )}
                {!!post.image_urls?.length && (
                  <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />
                )}
                <div className="actions">
                  {isOwnPost && !isEditing && (
                    <>
                      <button
                        type="button"
                        className="act"
                        onClick={() => {
                          setEditingPostId(post.id)
                          setEditedContent(post.content)
                          setEditedCategoryId(post.category_id)
                        }}
                      >
                        <Pencil size={14} strokeWidth={1.75} /> <span>{t('post_edit')}</span>
                      </button>
                      <button
                        type="button"
                        className="act danger"
                        disabled={deletePostMutation.isPending && deletePostMutation.variables?.postId === post.id}
                        onClick={() => {
                          if (window.confirm(`${t('admin_delete')}?`)) {
                            deletePostMutation.mutate({ postId: post.id })
                          }
                        }}
                      >
                        {deletePostMutation.isPending && deletePostMutation.variables?.postId === post.id ? <InlineSpinner size={14} /> : <Trash2 size={14} strokeWidth={1.75} />}
                        <span>{t('admin_delete')}</span>
                      </button>
                    </>
                  )}
                  {profile && (
                    <button
                      type="button"
                      className="act"
                      onClick={() => {
                        setQuotingPost(post)
                        composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        setTimeout(() => composerRef.current?.querySelector('textarea')?.focus(), 300)
                      }}
                    >
                      <Quote size={14} strokeWidth={1.75} /> <span>Citi</span>
                    </button>
                  )}
                  {profile ? (
                    <button
                      type="button"
                      className={`act${post.user_liked ? ' liked' : ''}`}
                      onClick={() => likeMutation.mutate(post)}
                      disabled={likePending}
                      aria-busy={likePending}
                    >
                      {likePending ? <InlineSpinner size={14} /> : <Heart size={14} strokeWidth={1.75} />} <span>{post.likes_count}</span>
                    </button>
                  ) : (
                    <span className="act-count"><Heart size={14} strokeWidth={1.75} /> {post.likes_count}</span>
                  )}
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

      {!isLoading && posts.length > 0 && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isFetchingNextPage ? (
            <InlineSpinner size={16} className="text-[var(--color-primary)]" />
          ) : hasNextPage ? (
            <span className="text-sm text-[var(--color-text-muted)]">{t('messages_loading')}</span>
          ) : (
            <span className="text-sm text-[var(--color-text-muted)]">{t('notif_empty', { defaultValue: 'No more posts.' })}</span>
          )}
        </div>
      )}

      <style>{`
        .page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0.1rem; }
        .page-header h1 { font-size: 1.1rem; font-weight: 700; color: var(--color-text); margin: 0; }
        .tabs { display: flex; gap: 0.1rem; }
        .refreshing { display: inline-flex; align-items: center; gap: 0.35rem; margin-left: 0.4rem; padding: 0.32rem 0.55rem; border-radius: 999px; font-size: 0.72rem; color: var(--color-primary); background: var(--color-primary-dim); white-space: nowrap; }
        .tab { background: none; border: none; padding: 0.4rem 0.75rem; font-size: 0.84rem; font-weight: 500; color: var(--color-text-muted); cursor: pointer; border-radius: 6px; font-family: inherit; transition: color 0.12s, background 0.12s; text-decoration: none; }
        .tab:hover { color: var(--color-text); }
        .tab.active { color: var(--color-text); background: var(--color-surface-alt); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 26%, var(--color-border)); font-weight: 600; }
        .beta-banner { display: flex; align-items: flex-start; gap: 0.75rem; background: #fefce8; border: 1px solid #fde047; border-radius: 10px; padding: 0.85rem 1rem; margin: 0.75rem 0; }
        .beta-icon { color: #ca8a04; flex-shrink: 0; margin-top: 1px; }
        .beta-copy { flex: 1; font-size: 0.84rem; line-height: 1.5; color: #78350f; display: flex; flex-direction: column; gap: 0.2rem; }
        .beta-copy strong { font-weight: 700; }
        .beta-close { background: none; border: none; color: #a16207; cursor: pointer; padding: 0.1rem; border-radius: 4px; flex-shrink: 0; display: flex; }
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
        .read-more { display: inline-flex; align-items: center; margin: -0.15rem 0 0.65rem; font-size: 0.8rem; font-weight: 600; color: var(--color-primary); text-decoration: none; }
        .read-more:hover { text-decoration: underline; }
        .actions { display: flex; gap: 0.15rem; align-items: center; }
        .act { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.5rem; background: transparent; border: none; font-size: 0.8rem; color: var(--color-text-muted); border-radius: 5px; cursor: pointer; transition: color 0.12s, background 0.12s; text-decoration: none; font-family: inherit; }
        .act:hover { color: var(--color-primary); background: var(--color-primary-dim); }
        .act:disabled { opacity: 0.7; cursor: wait; }
        .act.danger:hover { color: #dc2626; background: #dc262615; }
        button.act.liked { color: #e11d48; background: #f43f5e18; }
        .act span { font-variant-numeric: tabular-nums; }
        .post-link { color: var(--color-primary); text-decoration: none; }
        .post-link:hover { text-decoration: underline; }
        .guest-cta { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border); margin-bottom: 0.25rem; flex-wrap: wrap; font-size: 0.875rem; color: var(--color-text-muted); }
        .guest-cta-btn { padding: 0.35rem 0.9rem; border-radius: 6px; font-size: 0.825rem; font-weight: 600; text-decoration: none; background: var(--color-primary); color: #fff; transition: filter 0.12s; }
        .guest-cta-btn:hover { filter: brightness(1.05); }
        .guest-cta-btn.secondary { background: var(--color-surface-alt); color: var(--color-text); border: 1px solid var(--color-border); }
        .act-count { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--color-text-muted); }
        .act-count svg { opacity: 0.6; }
      `}</style>
    </>
  )
}
