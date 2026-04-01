import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, Heart, MessageSquare, Pencil, Quote, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { supabase } from '@/lib/supabase/client'
import { CATEGORY_COLORS } from '@/lib/icons'
import { fetchPostDetailWithFallback, normalizeQuotedPost } from '@/lib/postFeatures'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import { queryKeys } from '@/lib/query/keys'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { PostEditCard } from '@/components/PostEditCard'
import PostMedia from '@/components/PostMedia'
import { QuotedPostCard } from '@/components/QuotedPostCard'
import { LinkPreviewCard } from '@/components/LinkPreviewCard'
import { RichText } from '@/components/RichText'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { TimelineSkeleton } from '@/components/ui/TimelineSkeleton'
import { hasCommentEditChanges } from '@/lib/editor'
import type { Comment, ContentReportReason, Post } from '@/lib/types'
import { routes } from '@/lib/routes'
import {
  removeCommentInPostDetail,
  removePostInData,
  updateCommentInPostDetail,
  updatePostInData,
  updatePostLikeInData,
} from '@/lib/query/optimisticPosts'
import { commentSchema, postSchema } from '@/lib/validators'

const reportReasons: { value: ContentReportReason; label: string }[] = [
  { value: 'spam', label: 'report_reason_spam' },
  { value: 'harassment', label: 'report_reason_harassment' },
  { value: 'hate', label: 'report_reason_hate' },
  { value: 'nudity', label: 'report_reason_nudity' },
  { value: 'violence', label: 'report_reason_violence' },
  { value: 'misinformation', label: 'report_reason_misinformation' },
  { value: 'other', label: 'report_reason_other' },
]

async function fetchPostDetail(postId: string, userId?: string | null) {
  const [{ data: post, error }, categoriesRes] = await Promise.all([
    fetchPostDetailWithFallback(postId),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ])

  if (error || !post) throw new Error('Afiŝo ne trovita')
  if (categoriesRes.error) throw categoriesRes.error

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*, author:profiles!user_id(*)')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at')

  if (commentsError) throw commentsError

  let userLiked = false
  if (userId) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()
    userLiked = Boolean(like)
  }

  return {
    post: { ...normalizeQuotedPost(post as Post), user_liked: userLiked } as Post,
    comments: (comments ?? []) as Comment[],
    categories: categoriesRes.data ?? [],
  }
}

async function createReport(payload: {
  userId: string
  postId?: string
  commentId?: string
  reason: ContentReportReason
  details: string
}) {
  const { error } = await supabase.from('content_reports').insert({
    user_id: payload.userId,
    post_id: payload.postId ?? null,
    comment_id: payload.commentId ?? null,
    reason: payload.reason,
    details: payload.details,
  })
  if (error) throw error
}

function categoryLabel(t: TFunction, slug?: string) {
  return slug ? t(`cat_name_${slug}` as never) : ''
}

export default function PostDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const toast = useToastStore()
  const [commentContent, setCommentContent] = useState('')
  const [postReason, setPostReason] = useState<ContentReportReason>('spam')
  const [postDetails, setPostDetails] = useState('')
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editedPostContent, setEditedPostContent] = useState('')
  const [editedPostCategoryId, setEditedPostCategoryId] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => fetchPostDetail(id, user?.id),
    enabled: Boolean(id),
  })

  const post = data?.post
  const comments = data?.comments ?? []
  const categories = data?.categories ?? []
  const isOwnPost = Boolean(profile && post && profile.id === post.user_id)

  useEffect(() => {
    if (post) {
      setEditedPostContent(post.content)
      setEditedPostCategoryId(post.category_id)
    }
  }, [post?.id, post?.content, post?.category_id])

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !post) throw new Error('Ne ensalutinta')
      if (post.user_liked) {
        const { error } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
        if (error) throw error
      }
    },
    onMutate: async () => {
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      if (post) {
        queryClient.setQueryData(postKey, (current: unknown) => updatePostLikeInData(current, post.id))
      }
      return { previousPost, postKey }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(context.postKey, context.previousPost)
      }
      toast.error(t('toast_action_failed'))
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
  })

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !post) throw new Error('Ne ensalutinta')
      const content = commentContent.trim()
      if (!content) throw new Error(t('messages_send_error'))
      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user.id,
        content,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      setCommentContent('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(id) })
    },
    onError: (error: Error) => toast.error(error.message || t('toast_action_failed')),
  })

  const reportPostMutation = useMutation({
    mutationFn: async () => {
      if (!user || !post) throw new Error('Ne ensalutinta')
      await createReport({ userId: user.id, postId: post.id, reason: postReason, details: postDetails.trim() })
    },
    onSuccess: () => {
      setPostDetails('')
      toast.success(t('report_submitted'))
    },
    onError: () => toast.error(t('toast_action_failed')),
  })

  const reportCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason, details }: { commentId: string; reason: ContentReportReason; details: string }) => {
      if (!user) throw new Error('Ne ensalutinta')
      await createReport({ userId: user.id, commentId, reason, details: details.trim() })
    },
    onSuccess: () => toast.success(t('report_submitted')),
    onError: () => toast.error(t('toast_action_failed')),
  })

  const editPostMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !post) throw new Error('Ne ensalutinta')
      const parsed = postSchema.parse({
        content: editedPostContent.trim(),
        category_id: editedPostCategoryId,
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
        .eq('id', post.id)
        .eq('user_id', profile.id)
      if (error) throw error
      return { ...parsed, updated_at: nextUpdatedAt }
    },
    onMutate: async () => {
      if (!post) return null
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      const nextUpdatedAt = new Date().toISOString()
      queryClient.setQueryData(postKey, (current: unknown) =>
        updatePostInData(current, post.id, {
          content: editedPostContent.trim(),
          category_id: editedPostCategoryId,
          is_edited: true,
          updated_at: nextUpdatedAt,
        })
      )
      return { previousPost, postKey }
    },
    onSuccess: async () => {
      setIsEditingPost(false)
      toast.success(t('settings_saved'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(post?.author?.username ?? '') })
      await queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(context.postKey, context.previousPost)
      }
      toast.error(error.message || t('toast_action_failed'))
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !post) throw new Error('Ne ensalutinta')
      const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('user_id', profile.id)
      if (error) throw error
    },
    onMutate: async () => {
      if (!post) return null
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      queryClient.setQueryData(postKey, (current: unknown) => removePostInData(current, post.id))
      return { previousPost, postKey }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
      await queryClient.invalidateQueries({ queryKey: ['search'] })
      if (post?.author?.username) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.profile(post.author.username) })
      }
      navigate(routes.feed, { replace: true })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(context.postKey, context.previousPost)
      }
      toast.error(t('toast_action_failed'))
    },
  })

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      if (!profile) throw new Error('Ne ensalutinta')
      const parsed = commentSchema.parse({ content: editingCommentContent.trim() })
      const nextUpdatedAt = new Date().toISOString()
      const { error } = await supabase
        .from('comments')
        .update({ content: parsed.content, is_edited: true, updated_at: nextUpdatedAt })
        .eq('id', commentId)
        .eq('user_id', profile.id)
      if (error) throw error
      return { ...parsed, updated_at: nextUpdatedAt }
    },
    onMutate: async ({ commentId }) => {
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      queryClient.setQueryData(postKey, (current: unknown) =>
        updateCommentInPostDetail(current, commentId, {
          content: editingCommentContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
      )
      return { previousPost, postKey }
    },
    onSuccess: async () => {
      setEditingCommentId(null)
      setEditingCommentContent('')
      toast.success(t('settings_saved'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(id) })
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(context.postKey, context.previousPost)
      }
      toast.error(error.message || t('toast_action_failed'))
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      if (!profile) throw new Error('Ne ensalutinta')
      const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('user_id', profile.id)
      if (error) throw error
      return { commentId }
    },
    onMutate: async ({ commentId }) => {
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      queryClient.setQueryData(postKey, (current: unknown) => removeCommentInPostDetail(current, commentId))
      return { previousPost, postKey }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(context.postKey, context.previousPost)
      }
      toast.error(t('toast_action_failed'))
    },
  })

  if (isLoading) return <TimelineSkeleton items={2} />
  if (!post) return null

  return (
    <>
      <Helmet>
        <title>{post.author?.display_name ?? 'Afiŝo'} — Verdkomunumo</title>
      </Helmet>

      <Link to={routes.feed} className="back">{t('post_back')}</Link>

      <article className="post">
        <div className="author-row">
          {post.author && (
            <>
              <Link to={routes.profile(post.author.username)} className="ava-link">
                <img src={getAvatarUrl(post.author.avatar_url, post.author.display_name)} alt={post.author.display_name} className="ava" />
              </Link>
              <div className="author-info">
                <Link to={routes.profile(post.author.username)} className="dname">{post.author.display_name}</Link>
                <span className="muted">@{post.author.username}</span>
              </div>
            </>
          )}
          {post.category && (
            <Link
              to={routes.category(post.category.slug)}
              className="cat-tag"
              style={{ color: CATEGORY_COLORS[post.category.slug], background: `${CATEGORY_COLORS[post.category.slug]}15` }}
            >
              {categoryLabel(t, post.category.slug)}
            </Link>
          )}
        </div>

        {isEditingPost ? (
          <PostEditCard
            categories={categories.map((category) => ({ ...category, name: categoryLabel(t, category.slug) }))}
            content={editedPostContent}
            categoryId={editedPostCategoryId}
            initialContent={post.content}
            initialCategoryId={post.category_id}
            pending={editPostMutation.isPending}
            saveLabel={t('settings_save')}
            cancelLabel={t('suggestion_cancel')}
            onContentChange={setEditedPostContent}
            onCategoryChange={setEditedPostCategoryId}
            onCancel={() => {
              setIsEditingPost(false)
              setEditedPostContent(post.content)
              setEditedPostCategoryId(post.category_id)
            }}
            onSubmit={() => editPostMutation.mutate()}
          />
        ) : (
          <p className="content"><RichText content={post.content} /></p>
        )}
        {!!post.image_urls?.length && <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />}
        {post.quoted_post && (
          <QuotedPostCard post={post.quoted_post} />
        )}
        {post.link_preview && (
          <LinkPreviewCard preview={post.link_preview} />
        )}

        <div className="post-footer">
          <span className="time">{formatDate(post.created_at)}</span>
          {post.is_edited && <span className="edited">{t('post_edited')}</span>}
          {isOwnPost && !isEditingPost && (
            <div className="owner-actions">
              <button type="button" className="act" onClick={() => setIsEditingPost(true)}>
                <Pencil size={14} strokeWidth={1.75} /> {t('post_edit')}
              </button>
              <button
                type="button"
                className="act danger"
                disabled={deletePostMutation.isPending}
                onClick={() => {
                  if (window.confirm(`${t('admin_delete')}?`)) {
                    deletePostMutation.mutate()
                  }
                }}
              >
                {deletePostMutation.isPending ? <InlineSpinner size={13} /> : <Trash2 size={14} strokeWidth={1.75} />} {t('admin_delete')}
              </button>
            </div>
          )}
          <div className="stats">
            {user ? (
              <button type="button" className={`act${post.user_liked ? ' liked' : ''}`} onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}>
                {likeMutation.isPending ? <InlineSpinner size={14} /> : <Heart size={14} strokeWidth={1.75} />} {post.likes_count}
              </button>
            ) : (
              <span className="muted stat-line"><Heart size={14} strokeWidth={1.75} /> {post.likes_count}</span>
            )}
            <span className="muted stat-line"><MessageSquare size={14} strokeWidth={1.75} /> {post.comments_count}</span>
          </div>
        </div>

        <details className="report-box">
          <summary><Flag size={14} strokeWidth={1.8} /> {t('report_post')}</summary>
          <form className="report-form" onSubmit={(e) => { e.preventDefault(); reportPostMutation.mutate() }}>
            <label>
              <span>{t('report_reason_label')}</span>
              <select value={postReason} onChange={(e) => setPostReason(e.target.value as ContentReportReason)}>
                {reportReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>{t(reason.label as never)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('report_details_label')}</span>
              <textarea rows={2} maxLength={500} value={postDetails} onChange={(e) => setPostDetails(e.target.value)} placeholder={t('report_details_placeholder')} />
            </label>
            <button type="submit" className="report-submit" disabled={reportPostMutation.isPending}>
              {reportPostMutation.isPending ? <InlineSpinner size={13} className="mr-1.5" /> : null}
              {t('report_send')}
            </button>
          </form>
        </details>
      </article>

      {user ? (
        <div className="compose">
          <form onSubmit={(e) => { e.preventDefault(); commentMutation.mutate() }}>
            <textarea
              name="content"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={t('post_comment_placeholder')}
              rows={2}
            />
            <div className="compose-footer">
              <button type="submit" className="btn" disabled={commentMutation.isPending}>
                {commentMutation.isPending ? t('messages_sending') : t('post_comment_btn')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="guest-comment-cta">
          <Link to={`${routes.login}?next=${encodeURIComponent(window.location.pathname)}`} className="btn">{t('nav_login')}</Link>
          <span>{t('post_guest_comment_cta')}</span>
        </div>
      )}

      <section className="comments" id="comments">
        <h2>{t('post_comments')} <span className="count">({comments.length})</span></h2>

        {comments.length === 0 ? (
          <p className="empty">{t('post_no_comments')}</p>
        ) : (
          comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              onReport={(reason, details) => reportCommentMutation.mutate({ commentId: comment.id, reason, details })}
              canManage={Boolean(profile && profile.id === comment.user_id)}
              isEditing={editingCommentId === comment.id}
              editingValue={editingCommentId === comment.id ? editingCommentContent : comment.content}
              isSaving={editCommentMutation.isPending && editCommentMutation.variables?.commentId === comment.id}
              isDeleting={deleteCommentMutation.isPending && deleteCommentMutation.variables?.commentId === comment.id}
              onStartEdit={() => {
                setEditingCommentId(comment.id)
                setEditingCommentContent(comment.content)
              }}
              onCancelEdit={() => {
                setEditingCommentId(null)
                setEditingCommentContent('')
              }}
              onChangeEditingValue={setEditingCommentContent}
              onSaveEdit={() => editCommentMutation.mutate({ commentId: comment.id })}
              onDelete={() => {
                if (window.confirm(`${t('admin_delete')}?`)) {
                  deleteCommentMutation.mutate({ commentId: comment.id })
                }
              }}
            />
          ))
        )}
      </section>

      <style>{`
        .back { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.825rem; color: var(--color-text-muted); text-decoration: none; margin-bottom: 1.25rem; transition: color 0.12s; }
        .back:hover { color: var(--color-text); }
        .post { padding-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0; }
        .author-row { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .ava-link { display: block; text-decoration: none; flex-shrink: 0; }
        .ava { width: 40px; height: 40px; border-radius: 99px; object-fit: cover; transition: opacity 0.15s; }
        .ava-link:hover .ava { opacity: 0.8; }
        .author-info { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 0.4rem; flex-wrap: wrap; }
        .dname { font-size: 0.9rem; font-weight: 600; color: var(--color-text); text-decoration: none; }
        .dname:hover { text-decoration: underline; }
        .muted { font-size: 0.82rem; color: var(--color-text-muted); }
        .cat-tag { margin-left: auto; font-size: 0.7rem; padding: 0.1rem 0.45rem; border-radius: 99px; font-weight: 500; text-decoration: none; flex-shrink: 0; white-space: nowrap; transition: opacity 0.12s; }
        .cat-tag:hover { opacity: 0.75; }
        .content { font-size: 1rem; line-height: 1.7; color: var(--color-text); white-space: pre-wrap; margin: 0 0 1.25rem; }
        .post-footer { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; font-size: 0.8rem; }
        .time { color: var(--color-text-muted); }
        .edited { color: var(--color-text-muted); font-style: italic; }
        .owner-actions { display: inline-flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
        .stats { display: flex; gap: 0.5rem; margin-left: auto; align-items: center; }
        .stat-line { display: inline-flex; align-items: center; gap: 0.3rem; }
        .report-box,.comment-report { margin-top: 1rem; }
        .report-box summary,.comment-report summary { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; font-size: 0.8rem; color: var(--color-text-muted); }
        .report-form { margin-top: 0.75rem; display: grid; gap: 0.7rem; max-width: 420px; }
        .report-form.compact { max-width: 360px; }
        .report-form label { display: grid; gap: 0.3rem; }
        .report-form span { font-size: 0.78rem; color: var(--color-text-muted); }
        .report-form select,.report-form textarea { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); padding: 0.7rem 0.8rem; font: inherit; }
        .report-submit { width: fit-content; border: 1px solid #dc2626; background: transparent; color: #dc2626; border-radius: 0.7rem; padding: 0.55rem 0.85rem; font: inherit; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .report-submit:disabled { opacity: 0.7; cursor: wait; }
        .compose { padding: 0.85rem 0; border-bottom: 1px solid var(--color-border); }
        .compose textarea { width: 100%; background: transparent; border: none; outline: none; resize: none; font-size: 0.9rem; line-height: 1.6; color: var(--color-text); font-family: inherit; display: block; margin-bottom: 0.6rem; }
        .compose textarea::placeholder { color: var(--color-text-muted); }
        .compose-footer { display: flex; justify-content: flex-end; }
        .comments { margin-top: 0.25rem; }
        .comments h2 { font-size: 0.875rem; font-weight: 600; color: var(--color-text); padding: 0.75rem 0; margin: 0; border-bottom: 1px solid var(--color-border); }
        .count { color: var(--color-text-muted); font-weight: 400; }
        .empty { text-align: center; padding: 2.5rem 0; font-size: 0.875rem; color: var(--color-text-muted); }
        .act { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.5rem; background: transparent; border: none; font-size: 0.8rem; color: var(--color-text-muted); border-radius: 5px; cursor: pointer; transition: color 0.12s, background 0.12s; font-family: inherit; }
        .act:hover { color: var(--color-primary); background: var(--color-primary-dim); }
        .act:disabled { opacity: 0.7; cursor: wait; }
        .act.liked { color: #e11d48; background: #f43f5e18; }
        .act.danger:hover { color: #dc2626; background: #dc262615; }
        .post-link { color: var(--color-primary); text-decoration: none; }
        .post-link:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}

function CommentRow({
  comment,
  onReport,
  canManage,
  isEditing,
  editingValue,
  isSaving,
  isDeleting,
  onStartEdit,
  onCancelEdit,
  onChangeEditingValue,
  onSaveEdit,
  onDelete,
}: {
  comment: Comment
  onReport: (reason: ContentReportReason, details: string) => void
  canManage: boolean
  isEditing: boolean
  editingValue: string
  isSaving: boolean
  isDeleting: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onChangeEditingValue: (value: string) => void
  onSaveEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<ContentReportReason>('spam')
  const [details, setDetails] = useState('')
  const canSaveEdit = hasCommentEditChanges(comment.content, editingValue) && editingValue.trim().length > 0 && editingValue.length <= 2000

  return (
    <div className="comment">
      <div className="left">
        {comment.author && (
          <Link to={routes.profile(comment.author.username)} className="ava-link">
            <img src={getAvatarUrl(comment.author.avatar_url, comment.author.display_name)} alt={comment.author.display_name} className="ava-sm" />
          </Link>
        )}
      </div>
      <div className="right">
        <div className="cmeta">
          {comment.author && (
            <>
              <Link to={routes.profile(comment.author.username)} className="dname">{comment.author.display_name}</Link>
              <span className="muted">@{comment.author.username}</span>
              <span className="muted">·</span>
              <span className="muted small">{formatDate(comment.created_at)}</span>
              {comment.is_edited && (
                <>
                  <span className="muted">·</span>
                  <span className="muted small">{t('post_edited')}</span>
                </>
              )}
            </>
          )}
        </div>
        {isEditing ? (
          <form className="comment-edit-form" onSubmit={(event) => { event.preventDefault(); onSaveEdit() }}>
            <textarea
              rows={3}
              maxLength={2000}
              autoFocus
              value={editingValue}
              onChange={(event) => onChangeEditingValue(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSaveEdit && !isSaving) {
                  event.preventDefault()
                  onSaveEdit()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  onCancelEdit()
                }
              }}
            />
            <div className="comment-edit-actions">
              <span className="muted small">{2000 - editingValue.length}</span>
              <button type="button" className="ghost-btn" onClick={onCancelEdit}>{t('suggestion_cancel')}</button>
              <button type="submit" className="btn" disabled={isSaving || !canSaveEdit}>
                {isSaving ? <InlineSpinner size={13} className="mr-1.5" /> : null}
                {t('settings_save')}
              </button>
            </div>
          </form>
        ) : (
          <p className="ccontent">{comment.content}</p>
        )}
        <div className="comment-footer">
          <span className="act static"><Heart size={13} strokeWidth={1.75} /> {comment.likes_count}</span>
          {canManage && !isEditing && (
            <>
              <button type="button" className="act" onClick={onStartEdit}>
                <Pencil size={13} strokeWidth={1.75} /> {t('comment_edit')}
              </button>
              <button type="button" className="act danger" disabled={isDeleting} onClick={onDelete}>
                {isDeleting ? <InlineSpinner size={13} /> : <Trash2 size={13} strokeWidth={1.75} />} {t('admin_delete')}
              </button>
            </>
          )}
          <details className="comment-report">
            <summary><Flag size={12} strokeWidth={1.8} /> {t('report_comment')}</summary>
            <form className="report-form compact" onSubmit={(e) => { e.preventDefault(); onReport(reason, details); setDetails('') }}>
              <label>
                <span>{t('report_reason_label')}</span>
                <select value={reason} onChange={(e) => setReason(e.target.value as ContentReportReason)}>
                  {reportReasons.map((entry) => <option key={entry.value} value={entry.value}>{t(entry.label as never)}</option>)}
                </select>
              </label>
              <label>
                <span>{t('report_details_label')}</span>
                <textarea rows={2} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('report_details_placeholder')} />
              </label>
              <button type="submit" className="report-submit">{t('report_send')}</button>
            </form>
          </details>
        </div>
      </div>
      <style>{`
        .comment { display: flex; gap: 0.75rem; padding: 0.9rem 0; border-bottom: 1px solid var(--color-border); }
        .left { flex-shrink: 0; }
        .ava-link { display: block; text-decoration: none; flex-shrink: 0; }
        .ava-sm { width: 32px; height: 32px; border-radius: 99px; object-fit: cover; display: block; }
        .right { flex: 1; min-width: 0; }
        .cmeta { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.3rem; font-size: 0.82rem; }
        .dname { font-size: 0.9rem; font-weight: 600; color: var(--color-text); text-decoration: none; }
        .dname:hover { text-decoration: underline; }
        .muted { font-size: 0.82rem; color: var(--color-text-muted); }
        .small { font-size: 0.78rem; }
        .ccontent { font-size: 0.9rem; line-height: 1.6; color: var(--color-text); white-space: pre-wrap; margin: 0 0 0.45rem; }
        .comment-edit-form { display: grid; gap: 0.6rem; margin-bottom: 0.5rem; }
        .comment-edit-form textarea { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); padding: 0.75rem 0.85rem; font: inherit; }
        .comment-edit-actions { display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
        .comment-footer { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; }
        .act { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.5rem; background: transparent; border: none; font-size: 0.8rem; color: var(--color-text-muted); border-radius: 5px; cursor: pointer; transition: color 0.12s, background 0.12s; font-family: inherit; }
        .act.static { cursor: default; }
        .act.danger:hover { color: #dc2626; background: #dc262615; }
        .ghost-btn { border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); border-radius: 5px; padding: 0.35rem 0.75rem; font: inherit; cursor: pointer; }
        .btn { background: var(--color-primary); color: #fff; border: none; border-radius: 5px; padding: 0.35rem 0.9rem; font-size: 0.825rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.12s; display: inline-flex; align-items: center; justify-content: center; }
        .report-form { margin-top: 0.75rem; display: grid; gap: 0.7rem; max-width: 360px; }
        .report-form label { display: grid; gap: 0.3rem; }
        .report-form span { font-size: 0.78rem; color: var(--color-text-muted); }
        .report-form select,.report-form textarea { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); padding: 0.7rem 0.8rem; font: inherit; }
        .report-submit { width: fit-content; border: 1px solid #dc2626; background: transparent; color: #dc2626; border-radius: 0.7rem; padding: 0.55rem 0.85rem; font: inherit; cursor: pointer; }
      `}</style>
    </div>
  )
}
