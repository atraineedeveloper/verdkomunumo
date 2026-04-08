import type { Comment, Post } from '@/lib/types'

export function togglePostLikeState(post: Post): Post {
  const nextLiked = !post.user_liked
  const baseCount = Number(post.likes_count ?? 0)

  return {
    ...post,
    user_liked: nextLiked,
    likes_count: Math.max(0, baseCount + (nextLiked ? 1 : -1)),
  }
}

export function updatePostLikeInData<T>(data: T, postId: string): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }

  if (Array.isArray(record.posts)) {
    next.posts = record.posts.map((item) => {
      if (!item || typeof item !== 'object') return item
      const post = item as Post
      return post.id === postId ? togglePostLikeState(post) : post
    })
  }

  if (Array.isArray(record.pages)) {
    next.pages = record.pages.map((page) => updatePostLikeInData(page, postId))
  }

  if (record.post && typeof record.post === 'object') {
    const post = record.post as Post
    next.post = post.id === postId ? togglePostLikeState(post) : post
  }

  return next as T
}

export function updatePostInData<T>(data: T, postId: string, patch: Partial<Post>): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }

  if (Array.isArray(record.posts)) {
    next.posts = record.posts.map((item) => {
      if (!item || typeof item !== 'object') return item
      const post = item as Post
      return post.id === postId ? { ...post, ...patch } : post
    })
  }

  if (Array.isArray(record.pages)) {
    next.pages = record.pages.map((page) => updatePostInData(page, postId, patch))
  }

  if (record.post && typeof record.post === 'object') {
    const post = record.post as Post
    next.post = post.id === postId ? { ...post, ...patch } : post
  }

  return next as T
}

export function removePostInData<T>(data: T, postId: string): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }

  if (Array.isArray(record.posts)) {
    next.posts = record.posts.filter((item) => {
      if (!item || typeof item !== 'object') return true
      return (item as Post).id !== postId
    })
  }

  if (Array.isArray(record.pages)) {
    next.pages = record.pages.map((page) => removePostInData(page, postId))
  }

  if (record.post && typeof record.post === 'object' && (record.post as Post).id === postId) {
    next.post = null
  }

  return next as T
}

export function updateCommentInPostDetail<T>(data: T, commentId: string, patch: Partial<Comment>): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }

  if (Array.isArray(record.comments)) {
    next.comments = updateCommentTree(record.comments as Comment[], (comment) =>
      comment.id === commentId ? { ...comment, ...patch } : comment
    )
  }

  return next as T
}

export function toggleCommentLikeState(comment: Comment): Comment {
  const nextLiked = !comment.user_liked
  const baseCount = Number(comment.likes_count ?? 0)

  return {
    ...comment,
    user_liked: nextLiked,
    likes_count: Math.max(0, baseCount + (nextLiked ? 1 : -1)),
  }
}

export function updateCommentLikeInPostDetail<T>(data: T, commentId: string): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }

  if (Array.isArray(record.comments)) {
    next.comments = updateCommentTree(record.comments as Comment[], (comment) =>
      comment.id === commentId ? toggleCommentLikeState(comment) : comment
    )
  }

  return next as T
}

export function removeCommentInPostDetail<T>(data: T, commentId: string): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }
  let removedCount = 0

  if (Array.isArray(record.comments)) {
    const result = removeCommentTree(record.comments as Comment[], commentId)
    next.comments = result.comments
    removedCount = result.removedCount
  }

  if (removedCount > 0 && record.post && typeof record.post === 'object') {
    const post = record.post as Post
    next.post = {
      ...post,
      comments_count: Math.max(0, Number(post.comments_count ?? 0) - removedCount),
    }
  }

  return next as T
}

export function insertCommentInPostDetail<T>(data: T, comment: Comment): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }

  if (Array.isArray(record.comments)) {
    const comments = record.comments as Comment[]
    next.comments = comment.parent_id
      ? insertReplyInTree(comments, comment.parent_id, comment)
      : [...comments, { ...comment, replies: comment.replies ?? [] }]
  }

  if (record.post && typeof record.post === 'object') {
    const post = record.post as Post
    next.post = {
      ...post,
      comments_count: Math.max(0, Number(post.comments_count ?? 0) + 1),
    }
  }

  return next as T
}

function updateCommentTree(comments: Comment[], updater: (comment: Comment) => Comment): Comment[] {
  return comments.map((comment) => {
    const nextReplies = Array.isArray(comment.replies) ? updateCommentTree(comment.replies, updater) : comment.replies
    return updater({ ...comment, replies: nextReplies })
  })
}

function removeCommentTree(comments: Comment[], commentId: string): { comments: Comment[]; removedCount: number } {
  let removedCount = 0

  const nextComments = comments.flatMap((comment) => {
    if (comment.id === commentId) {
      removedCount += 1 + countReplies(comment.replies ?? [])
      return []
    }

    if (!Array.isArray(comment.replies) || comment.replies.length === 0) {
      return [comment]
    }

    const childResult = removeCommentTree(comment.replies, commentId)
    removedCount += childResult.removedCount
    return [{ ...comment, replies: childResult.comments }]
  })

  return { comments: nextComments, removedCount }
}

function insertReplyInTree(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), { ...reply, replies: reply.replies ?? [] }],
      }
    }

    if (!Array.isArray(comment.replies) || comment.replies.length === 0) {
      return comment
    }

    return {
      ...comment,
      replies: insertReplyInTree(comment.replies, parentId, reply),
    }
  })
}

function countReplies(comments: Comment[]): number {
  return comments.reduce((total, comment) => total + 1 + countReplies(comment.replies ?? []), 0)
}
