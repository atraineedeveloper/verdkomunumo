import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

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
