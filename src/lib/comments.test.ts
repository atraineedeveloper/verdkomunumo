import { describe, expect, it } from 'vitest'
import { buildCommentThread, flattenCommentTree, getReplyTarget } from './comments'
import type { Comment } from './types'

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    post_id: 'post-1',
    user_id: 'user-1',
    parent_id: null,
    content: 'Saluton',
    likes_count: 0,
    is_edited: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    replies: [],
    ...overrides,
  }
}

describe('comments utils', () => {
  it('builds a one-level comment tree ordered chronologically', () => {
    const comments = [
      makeComment({ id: 'reply-1', parent_id: 'root-1', created_at: '2026-01-01T00:02:00.000Z' }),
      makeComment({ id: 'root-2', created_at: '2026-01-01T00:03:00.000Z' }),
      makeComment({ id: 'root-1', created_at: '2026-01-01T00:01:00.000Z' }),
      makeComment({ id: 'reply-2', parent_id: 'root-1', created_at: '2026-01-01T00:04:00.000Z' }),
    ]

    const result = buildCommentThread(comments)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ id: 'root-1' })
    expect(result[0].replies?.map((reply) => reply.id)).toEqual(['reply-1', 'reply-2'])
    expect(result[1]).toMatchObject({ id: 'root-2' })
  })

  it('keeps orphaned replies as root comments', () => {
    const result = buildCommentThread([makeComment({ id: 'orphan', parent_id: 'missing-parent' })])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'orphan', parent_id: null })
  })

  it('flattens a comment tree', () => {
    const result = flattenCommentTree([
      makeComment({
        id: 'root',
        replies: [makeComment({ id: 'reply', parent_id: 'root' })],
      }),
    ])

    expect(result.map((comment) => comment.id)).toEqual(['root', 'reply'])
  })

  it('extracts the reply target from an authored comment', () => {
    expect(
      getReplyTarget(
        makeComment({
          id: 'replyable',
          author: {
            id: 'user-2',
            username: 'ana',
            display_name: 'Ana',
            bio: '',
            avatar_url: '',
            esperanto_level: 'komencanto',
            theme: 'green',
            role: 'user',
            website: '',
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            email_notifications_enabled: true,
            email_notify_like: true,
            email_notify_comment: true,
            email_notify_follow: true,
            email_notify_message: true,
            email_notify_mention: true,
            email_notify_category_approved: true,
            email_notify_category_rejected: true,
            country: null,
            region: null,
            city: null,
            location_lat: null,
            location_lng: null,
            map_visible: false,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        })
      )
    ).toEqual({
      id: 'replyable',
      username: 'ana',
      displayName: 'Ana',
    })
  })
})
