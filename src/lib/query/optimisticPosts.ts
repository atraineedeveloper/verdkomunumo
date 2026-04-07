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
    next.comments = record.comments.map((item) => {
      if (!item || typeof item !== 'object') return item
      const comment = item as Comment
      return comment.id === commentId ? { ...comment, ...patch } : comment
    })
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
    next.comments = record.comments.map((item) => {
      if (!item || typeof item !== 'object') return item
      const comment = item as Comment
      return comment.id === commentId ? toggleCommentLikeState(comment) : comment
    })
  }

  return next as T
}

export function removeCommentInPostDetail<T>(data: T, commentId: string): T {
  if (!data || typeof data !== 'object') return data

  const record = data as Record<string, unknown>
  const next = { ...record }
  let removed = false

  if (Array.isArray(record.comments)) {
    next.comments = record.comments.filter((item) => {
      if (!item || typeof item !== 'object') return true
      const shouldKeep = (item as Comment).id !== commentId
      if (!shouldKeep) removed = true
      return shouldKeep
    })
  }

  if (removed && record.post && typeof record.post === 'object') {
    const post = record.post as Post
    next.post = {
      ...post,
      comments_count: Math.max(0, Number(post.comments_count ?? 0) - 1),
    }
  }

  return next as T
}
