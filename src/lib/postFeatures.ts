import { supabase } from '@/lib/supabase/client'
import type { Post } from '@/lib/types'

const BASE_POST_SELECT = `
  *,
  author:profiles!posts_user_id_fkey(id,username,display_name,avatar_url),
  category:categories(id,slug,name),
  likes:likes(user_id)
`

const ENHANCED_FEED_POST_SELECT = `
  *,
  author:profiles!posts_user_id_fkey(id,username,display_name,avatar_url),
  category:categories(id,slug,name),
  likes:likes(user_id),
  quoted_post:posts!posts_quoted_post_id_fkey(
    id,
    content,
    image_urls,
    user_id,
    is_deleted,
    author:profiles!posts_user_id_fkey(id,username,display_name,avatar_url)
  )
`

const ENHANCED_DETAIL_POST_SELECT = `
  *,
  author:profiles!user_id(*),
  category:categories!category_id(*),
  quoted_post:posts!posts_quoted_post_id_fkey(
    id,
    content,
    image_urls,
    user_id,
    is_deleted,
    author:profiles!posts_user_id_fkey(id,username,display_name,avatar_url)
  )
`

function readErrorText(error: unknown): string {
  if (!error || typeof error !== 'object') return ''

  const candidate = error as Record<string, unknown>
  return [candidate.message, candidate.details, candidate.hint, candidate.code]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()
}

export function isOptionalPostFeaturesError(error: unknown): boolean {
  const text = readErrorText(error)

  return [
    'quoted_post_id',
    'link_preview',
    'posts_quoted_post_id_fkey',
    'pgrst',
    'schema cache',
    '42703',
  ].some((token) => text.includes(token))
}

export function normalizeQuotedPost<T extends { quoted_post?: Post | null }>(post: T): T {
  if (post.quoted_post?.is_deleted) {
    return { ...post, quoted_post: null }
  }

  return post
}

export async function fetchFeedPostsWithFallback(filterUserIds?: string[]) {
  const loadPosts = async (selectClause: string) => {
    let query = supabase
      .from('posts')
      .select(selectClause)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filterUserIds) {
      query = query.in('user_id', filterUserIds)
    }

    return query
  }

  const enhanced = await loadPosts(ENHANCED_FEED_POST_SELECT)

  if (enhanced.error && isOptionalPostFeaturesError(enhanced.error)) {
    return loadPosts(BASE_POST_SELECT)
  }

  return enhanced
}

export async function fetchPostDetailWithFallback(postId: string) {
  const enhanced = await supabase
    .from('posts')
    .select(ENHANCED_DETAIL_POST_SELECT)
    .eq('id', postId)
    .eq('is_deleted', false)
    .single()

  if (enhanced.error && isOptionalPostFeaturesError(enhanced.error)) {
    return supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()
  }

  return enhanced
}
