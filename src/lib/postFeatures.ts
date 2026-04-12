import { supabase } from '@/lib/supabase/client'
import type { Post } from '@/lib/types'

// Versioned to invalidate stale "unsupported" caches after the quoted-post schema shipped.
const OPTIONAL_POST_FEATURES_STORAGE_KEY = 'verdkomunumo:optional-post-features:v2'

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

type PostWithOptionalQuote = Post & {
  quoted_post_id?: string | null
  quoted_post?: Post | null
}

type QuotedPostPreview = Pick<Post, 'id' | 'content' | 'image_urls' | 'user_id' | 'is_deleted'> & {
  author?: Post['author']
}

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

async function hydrateMissingQuotedPosts<T extends PostWithOptionalQuote>(posts: T[]): Promise<T[]> {
  const missingQuotedIds = [...new Set(
    posts
      .filter((post) => post.quoted_post_id && !post.quoted_post)
      .map((post) => post.quoted_post_id)
      .filter((quotedPostId): quotedPostId is string => typeof quotedPostId === 'string' && quotedPostId.length > 0),
  )]

  if (missingQuotedIds.length === 0) return posts

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      image_urls,
      user_id,
      is_deleted,
      author:profiles!posts_user_id_fkey(id,username,display_name,avatar_url)
    `)
    .in('id', missingQuotedIds)
    .eq('is_deleted', false)

  if (error || !data) return posts

  const quotedPostsById = new Map(
    ((data as unknown) as QuotedPostPreview[]).map((quotedPost) => [
      quotedPost.id,
      quotedPost as Post,
    ]),
  )

  return posts.map((post) => {
    if (!post.quoted_post_id || post.quoted_post) return post
    const quotedPost = quotedPostsById.get(post.quoted_post_id)
    return quotedPost ? { ...post, quoted_post: quotedPost } : post
  })
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

  const loadAndHydratePosts = async (selectClause: string) => {
    const result = await loadPosts(selectClause)
    if (!result.error && Array.isArray(result.data)) {
      return {
        ...result,
        data: await hydrateMissingQuotedPosts((result.data as unknown) as PostWithOptionalQuote[]),
      }
    }
    return result
  }

  const support = readOptionalPostFeaturesSupport()
  if (support === false) {
    return loadAndHydratePosts(BASE_POST_SELECT)
  }

  const enhanced = await loadPosts(ENHANCED_FEED_POST_SELECT)

  if (enhanced.error && isOptionalPostFeaturesError(enhanced.error)) {
    writeOptionalPostFeaturesSupport(false)
    return loadAndHydratePosts(BASE_POST_SELECT)
  }

  if (!enhanced.error) {
    writeOptionalPostFeaturesSupport(true)
    if (Array.isArray(enhanced.data)) {
      return {
        ...enhanced,
        data: await hydrateMissingQuotedPosts((enhanced.data as unknown) as PostWithOptionalQuote[]),
      }
    }
  }

  return enhanced
}

export async function fetchPostDetailWithFallback(postId: string) {
  const loadBaseDetail = async () => {
    const result = await supabase
      .from('posts')
      .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (!result.error && result.data) {
      const [hydrated] = await hydrateMissingQuotedPosts([result.data as PostWithOptionalQuote])
      return { ...result, data: hydrated }
    }

    return result
  }

  const support = readOptionalPostFeaturesSupport()
  if (support === false) {
    return loadBaseDetail()
  }

  const enhanced = await supabase
    .from('posts')
    .select(ENHANCED_DETAIL_POST_SELECT)
    .eq('id', postId)
    .eq('is_deleted', false)
    .single()

  if (enhanced.error && isOptionalPostFeaturesError(enhanced.error)) {
    writeOptionalPostFeaturesSupport(false)
    return loadBaseDetail()
  }

  if (!enhanced.error) {
    writeOptionalPostFeaturesSupport(true)
    if (enhanced.data) {
      const [hydrated] = await hydrateMissingQuotedPosts([enhanced.data as PostWithOptionalQuote])
      return { ...enhanced, data: hydrated }
    }
  }

  return enhanced
}
