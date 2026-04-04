import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { CATEGORY_COLORS } from '@/lib/icons'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import { addPostLike } from '@/lib/likes'
import { queryKeys } from '@/lib/query/keys'
import { PostEditCard } from '@/components/PostEditCard'
import { PostExcerpt } from '@/components/PostExcerpt'
import PostMedia from '@/components/PostMedia'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { TimelineSkeleton } from '@/components/ui/TimelineSkeleton'
import type { Post, Profile } from '@/lib/types'
import { routes } from '@/lib/routes'
import { removePostInData, updatePostInData, updatePostLikeInData } from '@/lib/query/optimisticPosts'
import { postSchema } from '@/lib/validators'

async function fetchSearch(q: string, tab: 'posts' | 'users', userId?: string | null) {
  if (q.trim().length < 2) return { posts: [] as Post[], users: [] as Profile[] }

  const profileQuery = supabase.from('profiles').select('*').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(20)
  const authorIdsQuery = supabase.from('profiles').select('id').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(20)
  const [{ data: users }, { data: authorMatches }] = await Promise.all([profileQuery, authorIdsQuery])

  const authorIds = (authorMatches ?? []).map((profile) => profile.id)
  let postQuery = supabase.from('posts').select('*, author:profiles!user_id(*), category:categories!category_id(*)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(20)

  if (authorIds.length > 0) {
    postQuery = postQuery.or(`content.ilike.%${q}%,user_id.in.(${authorIds.join(',')})`)
  } else {
    postQuery = postQuery.ilike('content', `%${q}%`)
  }

  const { data: posts } = await postQuery
  const postIds = (posts ?? []).map((post) => post.id)
  let likedPostIds = new Set<string>()
  if (userId && postIds.length > 0) {
    const { data: likes } = await supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
    likedPostIds = new Set((likes ?? []).map((like) => like.post_id))
  }

  return {
    posts: ((posts ?? []).map((post) => ({ ...post, user_liked: likedPostIds.has(post.id) })) as Post[]),
    users: (users ?? []) as Profile[],
  }
}

export default function SearchPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const toast = useToastStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [editedCategoryId, setEditedCategoryId] = useState('')
  const q = searchParams.get('q')?.trim() ?? ''
  const tab = searchParams.get('tab') === 'users' ? 'users' : 'posts'

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.search(q, tab),
    queryFn: () => fetchSearch(q, tab, user?.id),
  })

  const posts = data?.posts ?? []
  const users = data?.users ?? []

  const likeMutation = useMutation({
    mutationFn: async (post: Post) => {
      if (!user) throw new Error('Ne ensalutinta')
      if (post.user_liked) {
        const { error } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
        if (error) throw error
      } else {
        await addPostLike(post.id, user.id)
      }
    },
    onMutate: async (post) => {
      const searchKey = queryKeys.search(q, tab)
      await queryClient.cancelQueries({ queryKey: searchKey })
      const previousSearch = queryClient.getQueryData(searchKey)
      queryClient.setQueryData(searchKey, (current: unknown) => updatePostLikeInData(current, post.id))
      return { previousSearch, searchKey }
    },
    onError: (_error, _post, context) => {
      if (context?.previousSearch) {
        queryClient.setQueryData(context.searchKey, context.previousSearch)
      }
      toast.error(t('toast_action_failed'))
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.search(q, tab) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
  })

  const editPostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!profile) throw new Error('Ne ensalutinta')
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
      return { postId, updated_at: nextUpdatedAt }
    },
    onMutate: async ({ postId }) => {
      const searchKey = queryKeys.search(q, tab)
      await queryClient.cancelQueries({ queryKey: searchKey })
      const previousSearch = queryClient.getQueryData(searchKey)
      const nextUpdatedAt = new Date().toISOString()
      queryClient.setQueryData(searchKey, (current: unknown) =>
        updatePostInData(current, postId, {
          content: editedContent.trim(),
          category_id: editedCategoryId,
          is_edited: true,
          updated_at: nextUpdatedAt,
        })
      )
      return { previousSearch, searchKey }
    },
    onSuccess: async ({ postId }) => {
      setEditingPostId(null)
      setEditedContent('')
      setEditedCategoryId('')
      toast.success(t('settings_saved'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.search(q, tab) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSearch) {
        queryClient.setQueryData(context.searchKey, context.previousSearch)
      }
      toast.error(error.message || t('toast_action_failed'))
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!profile) throw new Error('Ne ensalutinta')
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', profile.id)
      if (error) throw error
      return { postId }
    },
    onMutate: async ({ postId }) => {
      const searchKey = queryKeys.search(q, tab)
      await queryClient.cancelQueries({ queryKey: searchKey })
      const previousSearch = queryClient.getQueryData(searchKey)
      queryClient.setQueryData(searchKey, (current: unknown) => removePostInData(current, postId))
      return { previousSearch, searchKey }
    },
    onSuccess: async ({ postId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.search(q, tab) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSearch) {
        queryClient.setQueryData(context.searchKey, context.previousSearch)
      }
      toast.error(t('toast_action_failed'))
    },
  })

  function tabHref(nextTab: 'posts' | 'users') {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    params.set('tab', nextTab)
    return `${routes.search}?${params.toString()}`
  }

  return (
    <>
      <Helmet><title>{t('search_title')} — Verdkomunumo</title></Helmet>

      <div className="search-wrap">
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="hidden"
            name="tab"
            value={tab}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value.trim()) params.set('q', e.target.value)
              else params.delete('q')
              params.set('tab', tab)
              setSearchParams(params)
            }}
            placeholder={t('search_placeholder')}
            className="search-input"
          />
        </form>
      </div>

      <div className="tabs">
        <Link className={`tab${tab === 'posts' ? ' active' : ''}`} to={tabHref('posts')}>
          {t('search_posts')}{posts.length > 0 && <span className="count">{posts.length}</span>}
        </Link>
        <Link className={`tab${tab === 'users' ? ' active' : ''}`} to={tabHref('users')}>
          {t('search_users')}{users.length > 0 && <span className="count">{users.length}</span>}
        </Link>
        {isFetching && q.trim().length >= 2 && (
          <span className="refreshing" aria-live="polite">
            <InlineSpinner size={12} />
          </span>
        )}
      </div>

      {q.trim().length < 2 ? (
        <p className="hint">{t('search_hint')}</p>
      ) : isLoading ? (
        <TimelineSkeleton items={3} />
      ) : tab === 'posts' ? (
        posts.length === 0 ? (
          <p className="empty">{t('search_empty')}</p>
        ) : (
          <div className="timeline">
            {posts.map((post) => {
              const isEditing = editingPostId === post.id
              const canManage = profile?.id === post.user_id
              const likePending = likeMutation.isPending && likeMutation.variables?.id === post.id
              return (
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
                    {post.category && (
                      <Link to={routes.category(post.category.slug)} className="cat" style={{ color: CATEGORY_COLORS[post.category.slug], background: `${CATEGORY_COLORS[post.category.slug]}15` }}>
                        {t(`cat_name_${post.category.slug}` as never)}
                      </Link>
                    )}
                  </div>
                  {isEditing ? (
                    <PostEditCard
                      categories={post.category ? [{ ...post.category, name: t(`cat_name_${post.category.slug}` as never) }] : []}
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
                        maxLines={4}
                        maxChars={280}
                      />
                    </div>
                  )}
                  {!!post.image_urls?.length && <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />}
                  <div className="acts">
                    <button type="button" className={`act act-btn${post.user_liked ? ' liked' : ''}`} onClick={() => likeMutation.mutate(post)}>
                      {likePending ? <InlineSpinner size={13} /> : <Heart size={13} strokeWidth={1.75} />} {post.likes_count}
                    </button>
                    <span className="act"><MessageSquare size={13} strokeWidth={1.75} /> {post.comments_count}</span>
                    {canManage && !isEditing && (
                      <>
                        <button type="button" className="act act-btn" onClick={() => {
                          setEditingPostId(post.id)
                          setEditedContent(post.content)
                          setEditedCategoryId(post.category_id)
                        }}>
                          <Pencil size={13} strokeWidth={1.75} /> {t('post_edit')}
                        </button>
                        <button
                          type="button"
                          className="act act-btn danger"
                          disabled={deletePostMutation.isPending && deletePostMutation.variables?.postId === post.id}
                          onClick={() => {
                            if (window.confirm(`${t('admin_delete')}?`)) {
                              deletePostMutation.mutate({ postId: post.id })
                            }
                          }}
                        >
                          {deletePostMutation.isPending && deletePostMutation.variables?.postId === post.id ? <InlineSpinner size={13} /> : <Trash2 size={13} strokeWidth={1.75} />} {t('admin_delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
              )
            })}
          </div>
        )
      ) : users.length === 0 ? (
        <p className="empty">{t('search_empty')}</p>
      ) : (
        <div className="user-list">
          {users.map((foundUser) => (
            <Link key={foundUser.id} to={routes.profile(foundUser.username)} className="user-row">
              <img src={getAvatarUrl(foundUser.avatar_url, foundUser.display_name)} alt={foundUser.display_name} className="user-ava" />
              <div className="user-info">
                <span className="user-name">{foundUser.display_name}</span>
                <span className="muted">@{foundUser.username}</span>
                {foundUser.bio && <p className="user-bio">{foundUser.bio}</p>}
              </div>
              <span className="followers">{foundUser.followers_count} {t('profile_followers')}</span>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .search-wrap { margin-bottom: 1rem; }
        .search-form { margin: 0; }
        .search-input { width: 100%; background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: 8px; padding: 0.55rem 0.9rem; font-size: 0.9375rem; color: var(--color-text); font-family: inherit; outline: none; transition: border-color 0.12s; }
        .search-input:focus { border-color: var(--color-primary); }
        .search-input::placeholder { color: var(--color-text-muted); }
        .tabs { display: flex; border-bottom: 1px solid var(--color-border); margin-bottom: 0.25rem; }
        .refreshing { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; color: var(--color-primary); }
        .tab { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; color: var(--color-text-muted); cursor: pointer; transition: color 0.12s, border-color 0.12s; font-family: inherit; display: flex; align-items: center; gap: 0.3rem; text-decoration: none; }
        .tab:hover { color: var(--color-text); }
        .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
        .count { font-size: 0.72rem; background: var(--color-primary-dim); color: var(--color-primary); padding: 0.1rem 0.4rem; border-radius: 99px; font-variant-numeric: tabular-nums; }
        .hint,.empty { text-align: center; padding: 3rem 0; font-size: 0.875rem; color: var(--color-text-muted); }
        .timeline { display: flex; flex-direction: column; }
        .entry { display: flex; gap: 0.85rem; padding: 1rem 0; border-bottom: 1px solid var(--color-border); }
        .entry:first-child { border-top: 1px solid var(--color-border); }
        .left { flex-shrink: 0; }
        .ava-link { display: block; text-decoration: none; }
        .ava { width: 38px; height: 38px; border-radius: 99px; object-fit: cover; display: block; }
        .ava-link:hover .ava { opacity: 0.8; }
        .right { flex: 1; min-width: 0; }
        .meta { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.35rem; font-size: 0.84rem; }
        .dname { font-weight: 600; color: var(--color-text); text-decoration: none; }
        .dname:hover { text-decoration: underline; }
        .muted { color: var(--color-text-muted); }
        .small { font-size: 0.8rem; }
        .cat { margin-left: auto; font-size: 0.7rem; padding: 0.1rem 0.45rem; border-radius: 99px; font-weight: 500; text-decoration: none; flex-shrink: 0; white-space: nowrap; }
        .body { text-decoration: none; display: block; }
        .content { font-size: 0.9rem; line-height: 1.6; color: var(--color-text); margin: 0 0 0.55rem; white-space: pre-wrap; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; }
        .read-more { display: inline-flex; align-items: center; margin: -0.15rem 0 0.55rem; font-size: 0.78rem; font-weight: 600; color: var(--color-primary); text-decoration: none; }
        .read-more:hover { text-decoration: underline; }
        .acts { display: flex; gap: 0.75rem; }
        .act { font-size: 0.8rem; color: var(--color-text-muted); display: inline-flex; align-items: center; gap: 0.3rem; }
        .act-btn { background: transparent; border: none; padding: 0; color: inherit; font: inherit; cursor: pointer; }
        .act-btn.liked { color: #e11d48; }
        .act-btn.danger:hover { color: #dc2626; }
        .user-list { display: flex; flex-direction: column; }
        .user-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 0; border-bottom: 1px solid var(--color-border); text-decoration: none; transition: background 0.12s; border-radius: 6px; }
        .user-row:first-child { border-top: 1px solid var(--color-border); }
        .user-row:hover { background: var(--color-surface-alt); padding-left: 0.5rem; padding-right: 0.5rem; margin: 0 -0.5rem; }
        .user-ava { width: 42px; height: 42px; border-radius: 99px; object-fit: cover; flex-shrink: 0; }
        .user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
        .user-name { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
        .user-bio { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.1rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .followers { font-size: 0.75rem; color: var(--color-text-muted); flex-shrink: 0; }
      `}</style>
    </>
  )
}
