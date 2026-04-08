import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, Heart, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { supabase } from '@/lib/supabase/client'
import { CATEGORY_COLORS } from '@/lib/icons'
import { fetchPostDetailWithFallback, normalizeQuotedPost } from '@/lib/postFeatures'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import { addCommentLike, addPostLike } from '@/lib/likes'
import { buildCommentThread, getReplyTarget, type ReplyTarget } from '@/lib/comments'
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
import { PresenceAvatar } from '@/components/ui/PresenceAvatar'
import { hasCommentEditChanges } from '@/lib/editor'
import type { Comment, ContentReportReason, Post } from '@/lib/types'
import { routes } from '@/lib/routes'
import {
  insertCommentInPostDetail,
  removeCommentInPostDetail,
  removePostInData,
  updateCommentInPostDetail,
  updateCommentLikeInPostDetail,
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

  if (error || !post) throw new Error('AfiÅo ne trovita')
  if (categoriesRes.error) throw categoriesRes.error

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*, author:profiles!user_id(*)')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at')

  if (commentsError) throw commentsError

  let userLiked = false
  let likedCommentIds = new Set<string>()
  if (userId) {
    const commentIds = (comments ?? []).map((comment) => comment.id)
    const [{ data: like }, commentLikesRes] = await Promise.all([
      supabase.from('likes').select('id').eq('user_id', userId).eq('post_id', postId).maybeSingle(),
      commentIds.length
        ? supabase.from('likes').select('comment_id').eq('user_id', userId).in('comment_id', commentIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    userLiked = Boolean(like)
    if (commentLikesRes.error) throw commentLikesRes.error
    likedCommentIds = new Set((commentLikesRes.data ?? []).map((entry) => entry.comment_id).filter(Boolean))
  }

  const hydratedComments = (comments ?? []).map((comment) => ({
    ...(comment as Comment),
    user_liked: likedCommentIds.has(comment.id),
    replies: [],
  })) as Comment[]

  return {
    post: { ...normalizeQuotedPost(post as Post), user_liked: userLiked } as Post,
    comments: buildCommentThread(hydratedComments),
    categories: categoriesRes.data ?? [],
  }
}

async function createReport(payload: { userId: string; postId?: string; commentId?: string; reason: ContentReportReason; details: string }) {
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
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null)
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
        await addPostLike(post.id, user.id)
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
      if (context?.previousPost) queryClient.setQueryData(context.postKey, context.previousPost)
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
      const parsed = commentSchema.parse({ content: commentContent.trim(), parent_id: replyTarget?.id })
      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user.id,
        content: parsed.content,
        parent_id: parsed.parent_id ?? null,
      })
      if (error) throw error
    },
    onMutate: async () => {
      if (!user || !profile || !post) return null
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      const now = new Date().toISOString()
      queryClient.setQueryData(postKey, (current: unknown) =>
        insertCommentInPostDetail(current, {
          id: `temp-${crypto.randomUUID()}`,
          post_id: post.id,
          user_id: user.id,
          parent_id: replyTarget?.id ?? null,
          content: commentContent.trim(),
          likes_count: 0,
          is_edited: false,
          is_deleted: false,
          created_at: now,
          updated_at: now,
          user_liked: false,
          author: profile,
          replies: [],
        })
      )
      return { previousPost, postKey }
    },
    onSuccess: async () => {
      setCommentContent('')
      setReplyTarget(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousPost) queryClient.setQueryData(context.postKey, context.previousPost)
      toast.error(error.message || t('toast_action_failed'))
    },
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
      const parsed = postSchema.parse({ content: editedPostContent.trim(), category_id: editedPostCategoryId })
      const nextUpdatedAt = new Date().toISOString()
      const { error } = await supabase
        .from('posts')
        .update({ content: parsed.content, category_id: parsed.category_id, is_edited: true, updated_at: nextUpdatedAt })
        .eq('id', post.id)
        .eq('user_id', profile.id)
      if (error) throw error
    },
    onMutate: async () => {
      if (!post) return null
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      queryClient.setQueryData(postKey, (current: unknown) =>
        updatePostInData(current, post.id, {
          content: editedPostContent.trim(),
          category_id: editedPostCategoryId,
          is_edited: true,
          updated_at: new Date().toISOString(),
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
      if (context?.previousPost) queryClient.setQueryData(context.postKey, context.previousPost)
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
      if (post?.author?.username) await queryClient.invalidateQueries({ queryKey: queryKeys.profile(post.author.username) })
      navigate(routes.feed, { replace: true })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPost) queryClient.setQueryData(context.postKey, context.previousPost)
      toast.error(t('toast_action_failed'))
    },
  })

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      if (!profile) throw new Error('Ne ensalutinta')
      const parsed = commentSchema.parse({ content: editingCommentContent.trim() })
      const { error } = await supabase
        .from('comments')
        .update({ content: parsed.content, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', profile.id)
      if (error) throw error
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
      if (context?.previousPost) queryClient.setQueryData(context.postKey, context.previousPost)
      toast.error(error.message || t('toast_action_failed'))
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      if (!profile) throw new Error('Ne ensalutinta')
      const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('user_id', profile.id)
      if (error) throw error
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
      if (context?.previousPost) queryClient.setQueryData(context.postKey, context.previousPost)
      toast.error(t('toast_action_failed'))
    },
  })

  const commentLikeMutation = useMutation({
    mutationFn: async ({ comment }: { comment: Comment }) => {
      if (!user) throw new Error('Ne ensalutinta')
      if (comment.user_liked) {
        const { error } = await supabase.from('likes').delete().eq('comment_id', comment.id).eq('user_id', user.id)
        if (error) throw error
      } else {
        await addCommentLike(comment.id, user.id)
      }
    },
    onMutate: async ({ comment }) => {
      const postKey = queryKeys.post(id)
      await queryClient.cancelQueries({ queryKey: postKey })
      const previousPost = queryClient.getQueryData(postKey)
      queryClient.setQueryData(postKey, (current: unknown) => updateCommentLikeInPostDetail(current, comment.id))
      return { previousPost, postKey }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPost) queryClient.setQueryData(context.postKey, context.previousPost)
      toast.error(t('toast_action_failed'))
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.post(id) })
    },
  })

  if (isLoading) return <TimelineSkeleton items={2} />
  if (!post) return null

  return (
    <>
      <Helmet>
        <title>{post.author?.display_name ?? 'AfiÅo'} â€” Verdkomunumo</title>
      </Helmet>
      <Link to={routes.feed} className="back">{t('post_back')}</Link>
      <article className="post">
        <div className="author-row">
          {post.author && (
            <>
              <Link to={routes.profile(post.author.username)} className="ava-link">
                <PresenceAvatar
                  userId={post.author.id}
                  avatarUrl={post.author.avatar_url}
                  displayName={post.author.display_name}
                  imageClassName="ava"
                />
              </Link>
              <div className="author-info">
                <Link to={routes.profile(post.author.username)} className="dname">{post.author.display_name}</Link>
                <span className="muted">@{post.author.username}</span>
              </div>
            </>
          )}
          {post.category && (
            <Link to={routes.category(post.category.slug)} className="cat-tag" style={{ color: CATEGORY_COLORS[post.category.slug], background: `${CATEGORY_COLORS[post.category.slug]}15` }}>
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
        {post.quoted_post && <QuotedPostCard post={post.quoted_post} />}
        {post.link_preview && <LinkPreviewCard preview={post.link_preview} />}
        <div className="post-footer">
          <span className="time">{formatDate(post.created_at)}</span>
          {post.is_edited && <span className="edited">{t('post_edited')}</span>}
          {isOwnPost && !isEditingPost && (
            <div className="owner-actions">
              <button type="button" className="act" onClick={() => setIsEditingPost(true)}><Pencil size={14} strokeWidth={1.75} /> {t('post_edit')}</button>
              <button type="button" className="act danger" disabled={deletePostMutation.isPending} onClick={() => { if (window.confirm(`${t('admin_delete')}?`)) deletePostMutation.mutate() }}>
                {deletePostMutation.isPending ? <InlineSpinner size={13} /> : <Trash2 size={14} strokeWidth={1.75} />} {t('admin_delete')}
              </button>
            </div>
          )}
          <div className="stats">
            {user ? (
              <button type="button" className={`act${post.user_liked ? ' liked' : ''}`} onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}>
                {likeMutation.isPending ? <InlineSpinner size={14} /> : <Heart size={14} strokeWidth={1.75} />} {post.likes_count}
              </button>
            ) : <span className="muted stat-line"><Heart size={14} strokeWidth={1.75} /> {post.likes_count}</span>}
            <span className="muted stat-line"><MessageSquare size={14} strokeWidth={1.75} /> {post.comments_count}</span>
          </div>
        </div>
        <details className="report-box">
          <summary><Flag size={14} strokeWidth={1.8} /> {t('report_post')}</summary>
          <form className="report-form" onSubmit={(e) => { e.preventDefault(); reportPostMutation.mutate() }}>
            <label>
              <span>{t('report_reason_label')}</span>
              <select value={postReason} onChange={(e) => setPostReason(e.target.value as ContentReportReason)}>
                {reportReasons.map((reason) => <option key={reason.value} value={reason.value}>{t(reason.label as never)}</option>)}
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
        <div className={`compose ${replyTarget ? 'opacity-50 pointer-events-none' : ''}`}>
          <form onSubmit={(e) => { e.preventDefault(); commentMutation.mutate() }}>
            <textarea name="content" value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder={t('post_comment_placeholder')} rows={2} />
            <div className="compose-footer">
              <button type="submit" className="btn" disabled={commentMutation.isPending}>{commentMutation.isPending ? t('messages_sending') : t('post_comment_btn')}</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="guest-comment-cta">
          <Link to={`${routes.login}?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`)}`} className="btn">{t('nav_login')}</Link>
          <span>{t('post_guest_comment_cta')}</span>
        </div>
      )}
      <section className="comments" id="comments">
        <h2>{t('post_comments')} <span className="count">({post.comments_count})</span></h2>
        {comments.length === 0 ? <p className="empty">{t('post_no_comments')}</p> : comments.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            depth={0}
            currentUserId={profile?.id ?? null}
            canLike={Boolean(user)}
            canReply={Boolean(user)}
            editingCommentId={editingCommentId}
            editingCommentContent={editingCommentContent}
            savingCommentId={editCommentMutation.variables?.commentId ?? null}
            deletingCommentId={deleteCommentMutation.variables?.commentId ?? null}
            likingCommentId={commentLikeMutation.variables?.comment.id ?? null}
            isSavingComment={editCommentMutation.isPending}
            isDeletingComment={deleteCommentMutation.isPending}
            isLikingComment={commentLikeMutation.isPending}
            onReply={(target) => setReplyTarget(target)}
            onStartEdit={(nextComment) => { setEditingCommentId(nextComment.id); setEditingCommentContent(nextComment.content) }}
            onCancelEdit={() => { setEditingCommentId(null); setEditingCommentContent('') }}
            onChangeEditingValue={setEditingCommentContent}
            onSaveEdit={(commentId) => editCommentMutation.mutate({ commentId })}
            onDelete={(commentId) => { if (window.confirm(`${t('admin_delete')}?`)) deleteCommentMutation.mutate({ commentId }) }}
            onToggleLike={(nextComment) => commentLikeMutation.mutate({ comment: nextComment })}
            onReport={(commentId, reason, details) => reportCommentMutation.mutate({ commentId, reason, details })}
            renderReplyComposer={(commentId) => (
              replyTarget?.id === commentId ? (
                <div className="compose nested-compose" style={{ paddingLeft: '2.5rem', borderBottom: 'none', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                  <form onSubmit={(e) => { e.preventDefault(); commentMutation.mutate() }}>
                    <div className="reply-banner" style={{ border: 'none', padding: '0', marginBottom: '0.5rem', background: 'transparent' }}>
                      <span style={{ fontWeight: 600 }}>{t('comment_replying_to', { username: replyTarget.username })}</span>
                    </div>
                    <textarea name="content" value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder={t('post_comment_placeholder')} rows={2} autoFocus />
                    <div className="compose-footer" style={{ gap: '0.5rem' }}>
                      <button type="button" className="act" onClick={() => { setReplyTarget(null); setCommentContent(''); }}>{t('suggestion_cancel')}</button>
                      <button type="submit" className="btn" disabled={commentMutation.isPending || !commentContent.trim()}>{commentMutation.isPending ? t('messages_sending') : t('post_comment_btn')}</button>
                    </div>
                  </form>
                </div>
              ) : null
            )}
          />
        ))}
      </section>
      <style>{`
        .back{display:inline-flex;align-items:center;gap:.3rem;font-size:.825rem;color:var(--color-text-muted);text-decoration:none;margin-bottom:1.25rem}.back:hover{color:var(--color-text)}.post{padding-bottom:1.25rem;border-bottom:1px solid var(--color-border)}.author-row{display:flex;align-items:center;gap:.65rem;margin-bottom:1rem;flex-wrap:wrap}.ava-link{display:block;text-decoration:none;flex-shrink:0}.ava{width:40px;height:40px;border-radius:99px;object-fit:cover}.author-info{flex:1;min-width:0;display:flex;align-items:baseline;gap:.4rem;flex-wrap:wrap}.dname{font-size:.9rem;font-weight:600;color:var(--color-text);text-decoration:none}.dname:hover{text-decoration:underline}.muted{font-size:.82rem;color:var(--color-text-muted)}.cat-tag{margin-left:auto;font-size:.7rem;padding:.1rem .45rem;border-radius:99px;font-weight:500;text-decoration:none;white-space:nowrap}.content{font-size:1rem;line-height:1.7;color:var(--color-text);white-space:pre-wrap;margin:0 0 1.25rem}.post-footer{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;font-size:.8rem}.time,.edited{color:var(--color-text-muted)}.edited{font-style:italic}.owner-actions,.stats{display:inline-flex;align-items:center;gap:.4rem;flex-wrap:wrap}.stats{margin-left:auto}.stat-line{display:inline-flex;align-items:center;gap:.3rem}.report-box{margin-top:1rem}.comment-report{margin-left:auto}.report-box summary,.comment-report summary{display:inline-flex;align-items:center;gap:.35rem;cursor:pointer;font-size:.8rem;color:var(--color-text-muted)}.report-box summary:hover,.comment-report summary:hover{color:var(--color-danger)}.report-form{margin-top:.75rem;display:grid;gap:.7rem;max-width:420px}.report-form.compact{max-width:360px;margin-top:.5rem;position:absolute;z-index:10;background:var(--color-surface);border:1px solid var(--color-border);padding:1rem;border-radius:0.75rem;box-shadow:0 10px 25px rgba(0,0,0,0.1);right:0}.report-form label{display:grid;gap:.3rem}.report-form span{font-size:.78rem;color:var(--color-text-muted)}.report-form select,.report-form textarea,.comment-edit-form textarea{width:100%;border-radius:.75rem;border:1px solid var(--color-border);background:var(--color-surface-alt);color:var(--color-text);padding:.7rem .8rem;font:inherit}.report-submit{width:fit-content;border:1px solid #dc2626;background:transparent;color:#dc2626;border-radius:.7rem;padding:.55rem .85rem;font:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.compose{padding:.85rem 0;border-bottom:1px solid var(--color-border)}.reply-banner{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.65rem;padding:.6rem .75rem;border:1px solid var(--color-border);border-radius:.8rem;background:var(--color-surface);color:var(--color-text-muted);font-size:.8rem}.compose textarea{width:100%;background:transparent;border:none;outline:none;resize:none;font-size:.9rem;line-height:1.6;color:var(--color-text);font-family:inherit;display:block;margin-bottom:.6rem}.compose-footer{display:flex;justify-content:flex-end}.comments{margin-top:.25rem}.comments h2{font-size:.875rem;font-weight:600;color:var(--color-text);padding:.75rem 0;margin:0;border-bottom:1px solid var(--color-border)}.count{color:var(--color-text-muted);font-weight:400}.empty{text-align:center;padding:2.5rem 0;font-size:.875rem;color:var(--color-text-muted)}.act{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .5rem;background:transparent;border:none;font-size:.8rem;color:var(--color-text-muted);border-radius:5px;cursor:pointer;font-family:inherit}.act:hover{color:var(--color-primary);background:var(--color-primary-dim)}.act:disabled{opacity:.7;cursor:wait}.act.liked{color:#e11d48;background:#f43f5e18}.act.danger:hover{color:#dc2626;background:#dc262615}.btn{background:var(--color-primary);color:#fff;border:none;border-radius:5px;padding:.35rem .9rem;font-size:.825rem;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center}
      `}</style>
    </>
  )
}

interface CommentRowProps {
  comment: Comment
  depth: number
  currentUserId: string | null
  canLike: boolean
  canReply: boolean
  editingCommentId: string | null
  editingCommentContent: string
  savingCommentId: string | null
  deletingCommentId: string | null
  likingCommentId: string | null
  isSavingComment: boolean
  isDeletingComment: boolean
  isLikingComment: boolean
  onReply: (target: ReplyTarget | null) => void
  onStartEdit: (comment: Comment) => void
  onCancelEdit: () => void
  onChangeEditingValue: (value: string) => void
  onSaveEdit: (commentId: string) => void
  onDelete: (commentId: string) => void
  onToggleLike: (comment: Comment) => void
  onReport: (commentId: string, reason: ContentReportReason, details: string) => void
  renderReplyComposer?: (commentId: string) => React.ReactNode
}

function CommentRow(props: CommentRowProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<ContentReportReason>('spam')
  const [details, setDetails] = useState('')
  const {
    comment,
    depth,
    currentUserId,
    canLike,
    canReply,
    editingCommentId,
    editingCommentContent,
    savingCommentId,
    deletingCommentId,
    likingCommentId,
    isSavingComment,
    isDeletingComment,
    isLikingComment,
    onReply,
    onStartEdit,
    onCancelEdit,
    onChangeEditingValue,
    onSaveEdit,
    onDelete,
    onToggleLike,
    onReport,
    renderReplyComposer,
  } = props
  const isEditing = editingCommentId === comment.id
  const editingValue = isEditing ? editingCommentContent : comment.content
  const isSaving = isSavingComment && savingCommentId === comment.id
  const isDeleting = isDeletingComment && deletingCommentId === comment.id
  const isLiking = isLikingComment && likingCommentId === comment.id
  const canManage = Boolean(currentUserId && currentUserId === comment.user_id)
  const canSaveEdit = hasCommentEditChanges(comment.content, editingValue) && editingValue.trim().length > 0 && editingValue.length <= 2000

  return (
    <div className={`comment-thread depth-${depth}`}>
      <div className="comment">
        <div className="left">
          {comment.author && (
            <Link to={routes.profile(comment.author.username)} className="ava-link">
              <PresenceAvatar
                userId={comment.author.id}
                avatarUrl={comment.author.avatar_url}
                displayName={comment.author.display_name}
                imageClassName="ava-sm"
              />
            </Link>
          )}
        </div>
        <div className="right">
          <div className="cmeta">
            {comment.author && (
              <>
                <Link to={routes.profile(comment.author.username)} className="dname">{comment.author.display_name}</Link>
                <span className="muted">@{comment.author.username}</span>
                <span className="muted">Â·</span>
                <span className="muted small">{formatDate(comment.created_at)}</span>
                {comment.is_edited && <><span className="muted">Â·</span><span className="muted small">{t('post_edited')}</span></>}
              </>
            )}
          </div>
          {isEditing ? (
            <form className="comment-edit-form" onSubmit={(event) => { event.preventDefault(); onSaveEdit(comment.id) }}>
              <textarea rows={3} maxLength={2000} autoFocus value={editingValue} onChange={(event) => onChangeEditingValue(event.target.value)} onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSaveEdit && !isSaving) { event.preventDefault(); onSaveEdit(comment.id) }
                if (event.key === 'Escape') { event.preventDefault(); onCancelEdit() }
              }} />
              <div className="comment-edit-actions">
                <span className="muted small">{2000 - editingValue.length}</span>
                <button type="button" className="act" onClick={onCancelEdit}>{t('suggestion_cancel')}</button>
                <button type="submit" className="btn" disabled={isSaving || !canSaveEdit}>{isSaving ? <InlineSpinner size={13} className="mr-1.5" /> : null}{t('settings_save')}</button>
              </div>
            </form>
          ) : <p className="ccontent">{comment.content}</p>}
          <div className="comment-footer">
            {canLike ? (
              <button type="button" className={`act${comment.user_liked ? ' liked' : ''}`} onClick={() => onToggleLike(comment)} disabled={isLiking}>
                {isLiking ? <InlineSpinner size={13} /> : <Heart size={13} strokeWidth={1.75} />} {comment.likes_count}
              </button>
            ) : <span className="act static"><Heart size={13} strokeWidth={1.75} /> {comment.likes_count}</span>}
            {canReply && depth === 0 && !isEditing && <button type="button" className="act" onClick={() => onReply(getReplyTarget(comment))}><MessageSquare size={13} strokeWidth={1.75} /> {t('comment_reply')}</button>}
            {canManage && !isEditing && (
              <>
                <button type="button" className="act" onClick={() => onStartEdit(comment)}><Pencil size={13} strokeWidth={1.75} /> {t('comment_edit')}</button>
                <button type="button" className="act danger" disabled={isDeleting} onClick={() => onDelete(comment.id)}>{isDeleting ? <InlineSpinner size={13} /> : <Trash2 size={13} strokeWidth={1.75} />} {t('admin_delete')}</button>
              </>
            )}
            <details className="comment-report">
              <summary><Flag size={12} strokeWidth={1.8} /> {t('report_comment')}</summary>
              <form className="report-form compact" onSubmit={(e) => { e.preventDefault(); onReport(comment.id, reason, details); setDetails('') }}>
                <label><span>{t('report_reason_label')}</span><select value={reason} onChange={(e) => setReason(e.target.value as ContentReportReason)}>{reportReasons.map((entry) => <option key={entry.value} value={entry.value}>{t(entry.label as never)}</option>)}</select></label>
                <label><span>{t('report_details_label')}</span><textarea rows={2} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('report_details_placeholder')} /></label>
                <button type="submit" className="report-submit">{t('report_send')}</button>
              </form>
            </details>
          </div>
        </div>
      </div>
      {renderReplyComposer?.(comment.id)}
      {!!comment.replies?.length && <div className="comment-replies">{comment.replies.map((reply) => <CommentRow key={reply.id} {...props} comment={reply} depth={depth + 1} />)}</div>}
      <style>{`
        .comment-thread.depth-1{margin-left:2.35rem}.comment{display:flex;gap:.75rem;padding:.9rem 0;border-bottom:1px solid var(--color-border)}.comment-replies{display:grid}.left{flex-shrink:0}.ava-sm{width:32px;height:32px;border-radius:99px;object-fit:cover;display:block}.right{flex:1;min-width:0}.cmeta{display:flex;align-items:baseline;flex-wrap:wrap;gap:.25rem;margin-bottom:.3rem;font-size:.82rem}.small{font-size:.78rem}.ccontent{font-size:.9rem;line-height:1.6;color:var(--color-text);white-space:pre-wrap;margin:0 0 .45rem}.comment-edit-form{display:grid;gap:.6rem;margin-bottom:.5rem}.comment-edit-actions{display:flex;align-items:center;gap:.5rem;justify-content:flex-end;flex-wrap:wrap}.comment-footer{display:flex;align-items:center;gap:.9rem;flex-wrap:wrap}
      `}</style>
    </div>
  )
}
