import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export interface LikeUser {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string | null
}

interface LikeListRow {
  created_at: string | null
  user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'> | Array<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>> | null
}

function isDuplicateLikeError(error: PostgrestError | null) {
  if (!error) return false
  return error.code === '23505' || error.message.toLowerCase().includes('duplicate key') || error.details?.toLowerCase().includes('duplicate key') || false
}

export async function addPostLike(postId: string, userId: string) {
  const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })
  if (error && !isDuplicateLikeError(error)) throw error
}

export async function addCommentLike(commentId: string, userId: string) {
  const { error } = await supabase.from('likes').insert({ comment_id: commentId, user_id: userId })
  if (error && !isDuplicateLikeError(error)) throw error
}

function normalizeLikeUsers(rows: LikeListRow[] | null | undefined): LikeUser[] {
  return (rows ?? [])
    .map((row) => ({
      created_at: row.created_at,
      user: Array.isArray(row.user) ? row.user[0] ?? null : row.user,
    }))
    .filter((row) => row.user?.id && row.user.username)
    .map((row) => ({
      id: row.user!.id,
      username: row.user!.username,
      display_name: row.user!.display_name,
      avatar_url: row.user!.avatar_url,
      created_at: row.created_at,
    }))
}

export async function fetchPostLikeUsers(postId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('created_at, user:profiles!user_id(id, username, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return normalizeLikeUsers((data ?? []) as LikeListRow[])
}

export async function fetchCommentLikeUsers(commentId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('created_at, user:profiles!user_id(id, username, display_name, avatar_url)')
    .eq('comment_id', commentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return normalizeLikeUsers((data ?? []) as LikeListRow[])
}
