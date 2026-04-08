import type { Comment } from './types'

export interface ReplyTarget {
  id: string
  username: string
  displayName: string
}

function sortCommentsByCreatedAt(comments: Comment[]) {
  return [...comments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export function buildCommentThread(comments: Comment[]): Comment[] {
  const byId = new Map<string, Comment>()
  const roots: Comment[] = []

  for (const comment of sortCommentsByCreatedAt(comments)) {
    byId.set(comment.id, { ...comment, replies: [] })
  }

  for (const comment of byId.values()) {
    if (!comment.parent_id) {
      roots.push(comment)
      continue
    }

    const parent = byId.get(comment.parent_id)
    if (!parent) {
      roots.push({ ...comment, parent_id: null })
      continue
    }

    parent.replies = [...(parent.replies ?? []), comment]
  }

  return roots
}

export function flattenCommentTree(comments: Comment[]): Comment[] {
  return comments.flatMap((comment) => [comment, ...(comment.replies ? flattenCommentTree(comment.replies) : [])])
}

export function getReplyTarget(comment: Comment): ReplyTarget | null {
  if (!comment.author) return null

  return {
    id: comment.id,
    username: comment.author.username,
    displayName: comment.author.display_name,
  }
}
