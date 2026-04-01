import { beforeEach, describe, expect, it } from 'vitest'
import { isOptionalPostFeaturesError, normalizeQuotedPost } from '@/lib/postFeatures'

beforeEach(() => {
  window.localStorage.clear()
})

describe('isOptionalPostFeaturesError', () => {
  it('detects missing optional column errors', () => {
    expect(isOptionalPostFeaturesError({ message: 'column posts.quoted_post_id does not exist' })).toBe(true)
    expect(isOptionalPostFeaturesError({ details: 'Could not find the relation posts_quoted_post_id_fkey in the schema cache' })).toBe(true)
    expect(isOptionalPostFeaturesError({ status: 400, message: 'Bad Request' })).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isOptionalPostFeaturesError({ message: 'permission denied for table posts' })).toBe(false)
    expect(isOptionalPostFeaturesError(null)).toBe(false)
  })
})

describe('normalizeQuotedPost', () => {
  it('clears quoted posts marked as deleted', () => {
    expect(
      normalizeQuotedPost({
        id: '1',
        quoted_post: {
          id: '2',
          is_deleted: true,
        } as any,
      }),
    ).toEqual({
      id: '1',
      quoted_post: null,
    })
  })

  it('keeps available quoted posts', () => {
    const post = {
      id: '1',
      quoted_post: {
        id: '2',
        content: 'hello',
      } as any,
    }

    expect(normalizeQuotedPost(post)).toEqual(post)
  })
})
