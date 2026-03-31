import { describe, expect, it } from 'vitest'
import {
  removeCommentInPostDetail,
  removePostInData,
  togglePostLikeState,
  updateCommentInPostDetail,
  updatePostInData,
  updatePostLikeInData,
} from './optimisticPosts'
import type { Comment, Post } from '@/lib/types'

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    user_id: 'user-1',
    category_id: 'cat-1',
    content: 'Saluton',
    image_urls: [],
    likes_count: 3,
    comments_count: 0,
    is_edited: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    user_liked: false,
    ...overrides,
  }
}

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    post_id: 'post-1',
    user_id: 'user-1',
    parent_id: null,
    content: 'Bela afiŝo',
    likes_count: 0,
    is_edited: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('optimisticPosts', () => {
  it('toggles likes optimistically on a single post', () => {
    const liked = togglePostLikeState(makePost())
    expect(liked.user_liked).toBe(true)
    expect(liked.likes_count).toBe(4)

    const unliked = togglePostLikeState(makePost({ user_liked: true, likes_count: 1 }))
    expect(unliked.user_liked).toBe(false)
    expect(unliked.likes_count).toBe(0)
  })

  it('updates matching posts in list-like query payloads', () => {
    const postA = makePost({ id: 'a', likes_count: 2, user_liked: false })
    const postB = makePost({ id: 'b', likes_count: 5, user_liked: true })

    const result = updatePostLikeInData({ posts: [postA, postB], users: [] }, 'a')

    expect(result.posts[0]).toMatchObject({ id: 'a', user_liked: true, likes_count: 3 })
    expect(result.posts[1]).toMatchObject({ id: 'b', user_liked: true, likes_count: 5 })
  })

  it('updates matching post detail payloads', () => {
    const post = makePost({ id: 'detail-1', likes_count: 9, user_liked: true })
    const result = updatePostLikeInData({ post, comments: [] }, 'detail-1')

    expect(result.post).toMatchObject({ id: 'detail-1', user_liked: false, likes_count: 8 })
  })

  it('updates post content in list-like and detail payloads', () => {
    const nextUpdatedAt = '2026-01-02T00:00:00.000Z'
    const result = updatePostInData(
      { posts: [makePost({ id: 'a' })], post: makePost({ id: 'a' }) },
      'a',
      { content: 'Nova enhavo', is_edited: true, updated_at: nextUpdatedAt }
    )

    expect(result.posts[0]).toMatchObject({ id: 'a', content: 'Nova enhavo', is_edited: true, updated_at: nextUpdatedAt })
    expect(result.post).toMatchObject({ id: 'a', content: 'Nova enhavo', is_edited: true, updated_at: nextUpdatedAt })
  })

  it('removes matching posts from list-like payloads', () => {
    const result = removePostInData({ posts: [makePost({ id: 'a' }), makePost({ id: 'b' })] }, 'a')

    expect(result.posts).toHaveLength(1)
    expect(result.posts[0]).toMatchObject({ id: 'b' })
  })

  it('updates matching comments in post detail payloads', () => {
    const nextUpdatedAt = '2026-01-02T00:00:00.000Z'
    const result = updateCommentInPostDetail(
      { post: makePost(), comments: [makeComment({ id: 'a' }), makeComment({ id: 'b' })] },
      'b',
      { content: 'Redaktita komento', is_edited: true, updated_at: nextUpdatedAt }
    )

    expect(result.comments[0]).toMatchObject({ id: 'a', content: 'Bela afiŝo' })
    expect(result.comments[1]).toMatchObject({ id: 'b', content: 'Redaktita komento', is_edited: true, updated_at: nextUpdatedAt })
  })

  it('removes matching comments in post detail payloads', () => {
    const result = removeCommentInPostDetail(
      { post: makePost({ comments_count: 2 }), comments: [makeComment({ id: 'a' }), makeComment({ id: 'b' })] },
      'a'
    )

    expect(result.comments).toHaveLength(1)
    expect(result.comments[0]).toMatchObject({ id: 'b' })
    expect(result.post).toMatchObject({ comments_count: 1 })
  })
})
