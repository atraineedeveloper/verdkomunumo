import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockPosts, mockProfile } from '$lib/mock'
import type { PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'
const MIN_QUERY_LENGTH = 2
const SEARCH_LIMIT = 20

export const load: PageServerLoad = async ({ locals, url }) => {
  const q = url.searchParams.get('q')?.trim() ?? ''
  const tab = url.searchParams.get('tab') === 'users' ? 'users' : 'posts'
  const { user } = await locals.safeGetSession()

  if (DEMO) {
    const allUsers = [
      ...new Map(mockPosts.filter((p) => p.author).map((p) => [p.author!.id, p.author!])).values(),
      mockProfile
    ]

    const posts =
      q.length < MIN_QUERY_LENGTH
        ? []
        : mockPosts.filter(
            (post) =>
              post.content.toLowerCase().includes(q.toLowerCase()) ||
              post.author?.display_name.toLowerCase().includes(q.toLowerCase())
          )

    const users =
      q.length < MIN_QUERY_LENGTH
        ? []
        : allUsers.filter(
            (user) =>
              user.display_name.toLowerCase().includes(q.toLowerCase()) ||
              user.username.toLowerCase().includes(q.toLowerCase())
          )

    return { q, tab, posts, users }
  }

  if (q.length < MIN_QUERY_LENGTH) {
    return { q, tab, posts: [], users: [] }
  }

  const profileQuery = locals.supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(SEARCH_LIMIT)

  const authorIdsQuery = locals.supabase
    .from('profiles')
    .select('id')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(SEARCH_LIMIT)

  const [{ data: users }, { data: authorMatches }] = await Promise.all([profileQuery, authorIdsQuery])

  const authorIds = (authorMatches ?? []).map((profile) => profile.id)

  let postQuery = locals.supabase
    .from('posts')
    .select('*, author:profiles!user_id(*), category:categories!category_id(*)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(SEARCH_LIMIT)

  if (authorIds.length > 0) {
    postQuery = postQuery.or(`content.ilike.%${q}%,user_id.in.(${authorIds.join(',')})`)
  } else {
    postQuery = postQuery.ilike('content', `%${q}%`)
  }

  const { data: posts } = await postQuery

  const postIds = (posts ?? []).map((post) => post.id)
  let likedPostIds = new Set<string>()

  if (user && postIds.length > 0) {
    const { data: likes } = await locals.supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    likedPostIds = new Set((likes ?? []).map((like) => like.post_id))
  }

  return {
    q,
    tab,
    posts: (posts ?? []).map((post) => ({ ...post, user_liked: likedPostIds.has(post.id) })),
    users: users ?? []
  }
}
