import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/icons'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import { queryKeys } from '@/lib/query/keys'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import PostComposer from '@/components/PostComposer'
import PostMedia from '@/components/PostMedia'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { TimelineSkeleton } from '@/components/ui/TimelineSkeleton'
import type { Category, Post } from '@/lib/types'
import { routes } from '@/lib/routes'
import { updatePostLikeInData } from '@/lib/query/optimisticPosts'

async function fetchCategoryPage(slug: string, userId?: string | null) {
  const [{ data: category }, { data: allCategories }] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', slug).single(),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ])
  if (!category) throw new Error('Kategorio ne trovita')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
    .eq('category_id', category.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const postIds = (posts ?? []).map((post) => post.id)
  let likedPostIds = new Set<string>()
  if (userId && postIds.length > 0) {
    const { data: likes } = await supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
    likedPostIds = new Set((likes ?? []).map((like) => like.post_id))
  }

  return {
    category: category as Category,
    categories: (allCategories ?? []) as Category[],
    posts: ((posts ?? []).map((post) => ({ ...post, user_liked: likedPostIds.has(post.id) })) as Post[]),
  }
}

export default function CategoryPage() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const toast = useToastStore()

  const { data, isLoading } = useQuery({
    queryKey: ['category-page', slug, user?.id],
    queryFn: () => fetchCategoryPage(slug, user?.id),
    enabled: Boolean(slug),
  })

  const category = data?.category
  const categories = data?.categories ?? []
  const posts = data?.posts ?? []

  const likeMutation = useMutation({
    mutationFn: async (post: Post) => {
      if (!user) throw new Error('Ne ensalutinta')
      if (post.user_liked) {
        const { error } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
        if (error) throw error
      }
    },
    onMutate: async (post) => {
      const categoryKey = ['category-page', slug, user?.id] as const
      await queryClient.cancelQueries({ queryKey: categoryKey })
      const previousCategory = queryClient.getQueryData(categoryKey)
      queryClient.setQueryData(categoryKey, (current: unknown) => updatePostLikeInData(current, post.id))
      return { previousCategory, categoryKey }
    },
    onError: (_error, _post, context) => {
      if (context?.previousCategory) {
        queryClient.setQueryData(context.categoryKey, context.previousCategory)
      }
      toast.error(t('toast_action_failed'))
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['category-page', slug, user?.id] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
  })

  if (isLoading) return <TimelineSkeleton items={3} withComposer />
  if (!category) return null

  const HeroIcon = CATEGORY_ICONS[category.slug]

  return (
    <>
      <Helmet><title>{category.icon} {t(`cat_name_${category.slug}` as never)} — Verdkomunumo</title></Helmet>

      <div className="cat-header">
        <span className="cat-icon" style={{ color: CATEGORY_COLORS[category.slug] ?? 'var(--color-primary)' }}>
          {HeroIcon && <HeroIcon size={32} strokeWidth={1.5} />}
        </span>
        <div className="cat-info">
          <h1>{t(`cat_name_${category.slug}` as never)}</h1>
          <p>{t(`cat_desc_${category.slug}` as never)}</p>
        </div>
      </div>

      <PostComposer categories={categories} defaultCategoryId={category.id} />

      {posts.length === 0 ? (
        <p className="empty">{t('category_empty')}</p>
      ) : (
        <div className="timeline">
          {posts.map((post) => (
            <article key={post.id} className="entry">
              <div className="left">
                {post.author && (
                  <Link to={routes.profile(post.author.username)} className="ava-link">
                    <img src={getAvatarUrl(post.author.avatar_url, post.author.display_name)} alt={post.author.display_name} className="ava" />
                  </Link>
                )}
              </div>
              <div className="right">
                <div className="meta">
                  {post.author && (
                    <>
                      <Link to={routes.profile(post.author.username)} className="dname">{post.author.display_name}</Link>
                      <span className="muted">@{post.author.username}</span>
                      <span className="muted">·</span>
                      <span className="muted small">{formatDate(post.created_at)}</span>
                    </>
                  )}
                </div>
                <Link to={routes.post(post.id)} className="body">
                  <p className="content">{post.content}</p>
                </Link>
                {!!post.image_urls?.length && <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />}
                <div className="actions">
                  <button type="button" className={`act${post.user_liked ? ' liked' : ''}`} onClick={() => likeMutation.mutate(post)} disabled={likeMutation.isPending && likeMutation.variables?.id === post.id}>
                    {likeMutation.isPending && likeMutation.variables?.id === post.id ? <InlineSpinner size={14} /> : <Heart size={14} strokeWidth={1.75} />} <span>{post.likes_count}</span>
                  </button>
                  <Link to={routes.post(post.id)} className="act"><MessageSquare size={14} strokeWidth={1.75} /> <span>{post.comments_count}</span></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .cat-header { display: flex; align-items: center; gap: 0.9rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem; }
        .cat-icon { font-size: 2rem; flex-shrink: 0; line-height: 1; }
        .cat-info { flex: 1; min-width: 0; }
        .cat-info h1 { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; color: var(--color-text); margin: 0 0 0.2rem; }
        .cat-info p { font-size: 0.825rem; color: var(--color-text-muted); margin: 0; }
        .empty { text-align: center; padding: 3rem 0; color: var(--color-text-muted); font-size: 0.875rem; }
        .timeline { display: flex; flex-direction: column; }
        .entry { display: flex; gap: 0.85rem; padding: 1rem 0; border-bottom: 1px solid var(--color-border); }
        .entry:first-child { border-top: 1px solid var(--color-border); }
        .left { flex-shrink: 0; }
        .ava-link { display: block; text-decoration: none; }
        .ava { width: 38px; height: 38px; border-radius: 99px; object-fit: cover; display: block; transition: opacity 0.15s; }
        .ava-link:hover .ava { opacity: 0.8; }
        .right { flex: 1; min-width: 0; }
        .meta { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.35rem; font-size: 0.84rem; }
        .dname { font-weight: 600; color: var(--color-text); text-decoration: none; }
        .dname:hover { text-decoration: underline; }
        .muted { color: var(--color-text-muted); }
        .small { font-size: 0.8rem; }
        .body { text-decoration: none; display: block; }
        .content { font-size: 0.9375rem; line-height: 1.6; color: var(--color-text); margin: 0 0 0.65rem; white-space: pre-wrap; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 6; line-clamp: 6; -webkit-box-orient: vertical; }
        .actions { display: flex; gap: 0.15rem; }
        .act { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.5rem; background: transparent; border: none; font-size: 0.8rem; color: var(--color-text-muted); border-radius: 5px; cursor: pointer; transition: color 0.12s, background 0.12s; text-decoration: none; font-family: inherit; }
        .act:hover { color: var(--color-primary); background: var(--color-primary-dim); }
        .act:disabled { opacity: 0.7; cursor: wait; }
        .act.liked { color: #e11d48; background: #f43f5e18; }
      `}</style>
    </>
  )
}
