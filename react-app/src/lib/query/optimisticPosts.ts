import type { Post } from '@/lib/types'

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

  if (record.post && typeof record.post === 'object') {
    const post = record.post as Post
    next.post = post.id === postId ? togglePostLikeState(post) : post
  }

  return next as T
}
