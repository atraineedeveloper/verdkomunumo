import { supabase } from '@/lib/supabase/client'
import type { Post } from '@/lib/types'

const OPTIONAL_POST_FEATURES_STORAGE_KEY = 'verdkomunumo:optional-post-features'

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

let optionalPostFeaturesSupported: boolean | null = null

function readOptionalPostFeaturesSupport() {
  if (optionalPostFeaturesSupported !== null) return optionalPostFeaturesSupported
  if (typeof window === 'undefined') return null

  const value = window.localStorage.getItem(OPTIONAL_POST_FEATURES_STORAGE_KEY)
  if (value === 'supported') {
    optionalPostFeaturesSupported = true
    return true
  }
  if (value === 'unsupported') {
    optionalPostFeaturesSupported = false
    return false
  }

  return null
}

function writeOptionalPostFeaturesSupport(value: boolean) {
  optionalPostFeaturesSupported = value
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    OPTIONAL_POST_FEATURES_STORAGE_KEY,
    value ? 'supported' : 'unsupported',
  )
}

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
  const candidate = (error && typeof error === 'object') ? (error as Record<string, unknown>) : null
  const status = typeof candidate?.status === 'number' ? candidate.status : null

  return status === 400 || [
    'quoted_post_id',
    'link_preview',
    'posts_quoted_post_id_fkey',
    'could not find a relationship',
    'there is no relationship',
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

export async function fetchFeedPostsWithFallback(options?: {
  filterUserIds?: string[]
  page?: number
  pageSize?: number
}) {
  const page = options?.page ?? 0
  const pageSize = options?.pageSize ?? 20

  const loadPosts = async (selectClause: string) => {
    let query = supabase
      .from('posts')
      .select(selectClause)
      .order('created_at', { ascending: false })
      .range(page * pageSize, ((page + 1) * pageSize) - 1)

    if (options?.filterUserIds) {
      query = query.in('user_id', options.filterUserIds)
    }

    return query
  }

  const support = readOptionalPostFeaturesSupport()
  if (support === false) {
    return loadPosts(BASE_POST_SELECT)
  }

  const enhanced = await loadPosts(ENHANCED_FEED_POST_SELECT)

  if (enhanced.error && isOptionalPostFeaturesError(enhanced.error)) {
    writeOptionalPostFeaturesSupport(false)
    return loadPosts(BASE_POST_SELECT)
  }

  if (!enhanced.error) {
    writeOptionalPostFeaturesSupport(true)
  }

  return enhanced
}

export async function fetchPostDetailWithFallback(postId: string) {
  const support = readOptionalPostFeaturesSupport()
  if (support === false) {
    return supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()
  }

  const enhanced = await supabase
    .from('posts')
    .select(ENHANCED_DETAIL_POST_SELECT)
    .eq('id', postId)
    .eq('is_deleted', false)
    .single()

  if (enhanced.error && isOptionalPostFeaturesError(enhanced.error)) {
    writeOptionalPostFeaturesSupport(false)
    return supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()
  }

  if (!enhanced.error) {
    writeOptionalPostFeaturesSupport(true)
  }

  return enhanced
}
