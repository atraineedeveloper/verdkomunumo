import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Heart, MessageSquare, Pencil, Quote, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { queryKeys } from '@/lib/query/keys'
import { formatDate } from '@/lib/utils'
import { addPostLike } from '@/lib/likes'
import { CATEGORY_COLORS } from '@/lib/icons'
import { PresenceAvatar } from '@/components/ui/PresenceAvatar'
import { PostEditCard } from '@/components/PostEditCard'
import PostMedia from '@/components/PostMedia'
import { QuotedPostCard } from '@/components/QuotedPostCard'
import { LinkPreviewCard } from '@/components/LinkPreviewCard'
import { PostExcerpt } from '@/components/PostExcerpt'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import type { Post, Category } from '@/lib/types'
import { routes } from '@/lib/routes'
import { removePostInData, updatePostInData, updatePostLikeInData } from '@/lib/query/optimisticPosts'
import { postSchema } from '@/lib/validators'

interface PostItemProps {
  post: Post
  categories: Category[]
  filter?: string
  onQuote?: (post: Post) => void
}

export function PostItem({ post, categories, filter = 'all', onQuote }: PostItemProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const profile = useAuthStore((s) => s.profile)
  const toast = useToastStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(post.content)
  const [editedCategoryId, setEditedCategoryId] = useState(post.category_id)

  const isOwnPost = profile?.id === post.user_id

  const likeMutation = useMutation({
    mutationFn: async (postToLike: Post) => {
      if (!profile) throw new Error('Not authenticated')
      if (postToLike.user_liked) {
        await supabase.from('likes').delete()
          .eq('post_id', postToLike.id).eq('user_id', profile.id)
      } else {
        await addPostLike(postToLike.id, profile.id)
      }
    },
    onMutate: async (postToLike) => {
      const queryKey = queryKeys.feed({ filter })
      await queryClient.cancelQueries({ queryKey })
      const previousFeed = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (current: unknown) => updatePostLikeInData(current, postToLike.id))
      return { previousFeed, queryKey }
    },
    onError: (_error, _postToLike, context) => {
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
      setIsEditing(false)
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

  const likePending = likeMutation.isPending && likeMutation.variables?.id === post.id

  return (
    <article className="entry">
      <div className="left">
        {post.author && (
          <Link to={routes.profile(post.author.username)} className="ava-wrap">
            <PresenceAvatar
              userId={post.author.id}
              avatarUrl={post.author.avatar_url}
              displayName={post.author.display_name}
              imageClassName="ava"
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
              setIsEditing(false)
              setEditedContent(post.content)
              setEditedCategoryId(post.category_id)
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
                  setIsEditing(true)
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
          {profile && onQuote && (
            <button
              type="button"
              className="act"
              onClick={() => onQuote(post)}
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
}
