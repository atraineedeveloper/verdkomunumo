import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Heart, MapPin, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { CATEGORY_COLORS, CATEGORY_ICONS, LEVEL_COLORS, LEVEL_ICONS } from '@/lib/icons'
import { ESPERANTO_LEVELS } from '@/lib/constants'
import { queryKeys } from '@/lib/query/keys'
import { getAvatarUrl } from '@/lib/utils'
import type { EsperantoLevel, Post, Profile } from '@/lib/types'
import { routes } from '@/lib/routes'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { TimelineSkeleton } from '@/components/ui/TimelineSkeleton'
import { updatePostLikeInData } from '@/lib/query/optimisticPosts'

async function fetchProfilePage(username: string, userId?: string | null) {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('username', username).single()
  if (error || !profile) throw new Error('Uzanto ne trovita')

  const isOwn = userId === profile.id
  let isFollowing = false
  if (userId && !isOwn) {
    const { data } = await supabase.from('follows').select('id').eq('follower_id', userId).eq('following_id', profile.id).maybeSingle()
    isFollowing = Boolean(data)
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*, category:categories!category_id(*)')
    .eq('user_id', profile.id)
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
    profile: profile as Profile,
    posts: ((posts ?? []).map((post) => ({ ...post, user_liked: likedPostIds.has(post.id) })) as Post[]),
    isOwn,
    isFollowing,
  }
}

function categoryName(t: TFunction, slug?: string) {
  return slug ? t(`cat_name_${slug}` as never) : ''
}

export default function ProfilePage() {
  const { username = '' } = useParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const toast = useToastStore()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: () => fetchProfilePage(username, user?.id),
    enabled: Boolean(username),
  })

  const profile = data?.profile
  const posts = data?.posts ?? []
  const isOwn = data?.isOwn ?? false
  const isFollowing = data?.isFollowing ?? false

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Ne ensalutinta')
      if (isFollowing) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id })
        if (error) throw error
      }
    },
    onSuccess: async () => {
      toast.success(t(isFollowing ? 'toast_unfollowed' : 'toast_followed'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(username) })
    },
    onError: () => toast.error(t('toast_action_failed')),
  })

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
      const profileKey = queryKeys.profile(username)
      await queryClient.cancelQueries({ queryKey: profileKey })
      const previousProfile = queryClient.getQueryData(profileKey)
      queryClient.setQueryData(profileKey, (current: unknown) => updatePostLikeInData(current, post.id))
      return { previousProfile, profileKey }
    },
    onError: (_error, _post, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(context.profileKey, context.previousProfile)
      }
      toast.error(t('toast_action_failed'))
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(username) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
  })

  if (isLoading) return <TimelineSkeleton items={3} />
  if (!profile) return null

  const levelInfo = ESPERANTO_LEVELS[profile.esperanto_level as EsperantoLevel]
  const LevelIcon = LEVEL_ICONS[profile.esperanto_level]

  return (
    <>
      <Helmet>
        <title>{profile.display_name} (@{profile.username}) — Verdkomunumo</title>
      </Helmet>

      <div className="profile-header">
        <img className="profile-avatar" src={getAvatarUrl(profile.avatar_url, profile.display_name)} alt={profile.display_name} />
        <div className="profile-info">
          <div className="profile-title-row">
            <div>
              <h1 className="profile-name">{profile.display_name}</h1>
              <p className="profile-username">@{profile.username}</p>
            </div>

            {isOwn ? (
              <Link to={routes.settings} className="btn-outline">{t('profile_edit')}</Link>
            ) : (
              <div className="profile-actions">
                <Link to={`${routes.messages}?new=${profile.username}`} className="btn-outline btn-msg">
                  <MessageSquare size={13} strokeWidth={2} />
                  {t('messages_new')}
                </Link>
                <button type="button" className={`btn-follow${isFollowing ? ' following' : ''}`} onClick={() => followMutation.mutate()} disabled={followMutation.isPending}>
                  {followMutation.isPending ? <InlineSpinner size={13} className="mr-1.5" /> : null}
                  {isFollowing ? t('profile_unfollow') : t('profile_follow')}
                </button>
              </div>
            )}
          </div>

          <div className="profile-level" style={{ color: LEVEL_COLORS[profile.esperanto_level] ?? 'var(--color-primary)' }}>
            {LevelIcon && <LevelIcon size={14} strokeWidth={1.75} />}
            <span>{levelInfo.label}</span>
          </div>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-meta">
            {profile.location && <span><MapPin size={13} strokeWidth={1.75} /> {profile.location}</span>}
            {profile.website && <a href={profile.website} target="_blank" rel="noopener"><ExternalLink size={13} strokeWidth={1.75} /> {profile.website}</a>}
          </div>

          <div className="profile-stats">
            <span><strong>{profile.posts_count}</strong> {t('profile_posts')}</span>
            <span><strong>{profile.followers_count}</strong> {t('profile_followers')}</span>
            <span><strong>{profile.following_count}</strong> {t('profile_following')}</span>
          </div>
        </div>
      </div>

      <div className="profile-posts">
        <h2 className="posts-heading">{t('profile_posts_title')}</h2>

        {posts.length === 0 ? (
          <p className="empty">{t('profile_no_posts')}</p>
        ) : (
          posts.map((post) => {
            const CatIcon = post.category ? CATEGORY_ICONS[post.category.slug] : null
            const catColor = post.category ? CATEGORY_COLORS[post.category.slug] : undefined
            return (
              <article key={post.id} className="post-card">
                <Link to={routes.post(post.id)} className="post-content">{post.content}</Link>
                <div className="post-meta">
                  {post.category && (
                    <span className="post-category" style={{ color: catColor, background: `${catColor}18` }}>
                      {CatIcon && <CatIcon size={12} strokeWidth={2} />}
                      {categoryName(t, post.category.slug)}
                    </span>
                  )}
                  <span className="post-date">{new Date(post.created_at).toLocaleDateString('eo')}</span>
                  <button type="button" className={`stat-btn rose${post.user_liked ? ' active' : ''}`} onClick={() => likeMutation.mutate(post)} disabled={likeMutation.isPending && likeMutation.variables?.id === post.id}>
                    {likeMutation.isPending && likeMutation.variables?.id === post.id ? <InlineSpinner size={12} /> : <Heart size={12} strokeWidth={1.75} />} {post.likes_count}
                  </button>
                  <span className="stat blue"><MessageSquare size={12} strokeWidth={1.75} /> {post.comments_count}</span>
                </div>
              </article>
            )
          })
        )}
      </div>

      <style>{`
        .profile-header { display: flex; gap: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
        .profile-avatar { width: 80px; height: 80px; border-radius: 9999px; object-fit: cover; border: 3px solid var(--color-primary); flex-shrink: 0; }
        @media (min-width: 480px) { .profile-avatar { width: 96px; height: 96px; } }
        .profile-info { flex: 1; min-width: 0; }
        .profile-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
        .profile-name { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 0; }
        .profile-username { color: var(--color-text-muted); font-size: 0.9rem; margin: 0; }
        .profile-level { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 9999px; padding: 0.2rem 0.6rem; font-size: 0.8rem; margin-bottom: 0.75rem; }
        .profile-bio { color: var(--color-text); font-size: 0.9rem; margin: 0 0 0.75rem; white-space: pre-wrap; }
        .profile-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.75rem; }
        .profile-meta span,.profile-meta a { display: inline-flex; align-items: center; gap: 0.25rem; }
        .profile-meta a { color: var(--color-primary); text-decoration: none; }
        .profile-stats { display: flex; gap: 1rem; font-size: 0.875rem; color: var(--color-text-muted); }
        .profile-stats strong { color: var(--color-text); }
        .btn-outline { padding: 0.4rem 0.9rem; border: 1px solid var(--color-border); border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; color: var(--color-text); text-decoration: none; white-space: nowrap; transition: border-color 0.15s; background: transparent; }
        .btn-outline:hover { border-color: var(--color-primary); }
        .profile-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
        .btn-msg { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-text-muted); }
        .btn-follow { padding: 0.4rem 1.1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: opacity 0.15s; }
        .btn-follow { display: inline-flex; align-items: center; justify-content: center; }
        .btn-follow.following { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
        .btn-follow:hover { opacity: 0.85; }
        .btn-follow:disabled { opacity: 0.7; cursor: wait; }
        .posts-heading { font-size: 1rem; font-weight: 600; color: var(--color-text); margin: 0 0 1rem; }
        .post-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.75rem; }
        .post-content { display: block; color: var(--color-text); font-size: 0.9rem; text-decoration: none; margin-bottom: 0.5rem; white-space: pre-wrap; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; }
        .post-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8rem; color: var(--color-text-muted); align-items: center; }
        .post-category { display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 500; padding: 0.15rem 0.45rem; border-radius: 999px; }
        .stat { display: inline-flex; align-items: center; gap: 0.25rem; }
        .stat.blue { color: #60a5fa; }
        .stat-btn { display: inline-flex; align-items: center; gap: 0.25rem; background: transparent; border: none; padding: 0; font: inherit; cursor: pointer; color: inherit; }
        .stat-btn:disabled { opacity: 0.7; cursor: wait; }
        .stat-btn.rose { color: #f43f5e; }
        .stat-btn.rose.active { background: #f43f5e18; border-radius: 999px; padding: 0.18rem 0.45rem; }
        .empty { color: var(--color-text-muted); text-align: center; padding: 2rem; font-size: 0.9rem; }
      `}</style>
    </>
  )
}
