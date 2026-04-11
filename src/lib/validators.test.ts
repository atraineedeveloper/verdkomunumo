// @ts-nocheck
import { describe, it, expect } from 'bun:test'
import { postSchema } from './validators'
import { POST_MAX_LENGTH } from './constants'

describe('postSchema', () => {
  const validCategoryId = '550e8400-e29b-41d4-a716-446655440000'

  it('should validate a correct post object', () => {
    const validPost = {
      content: 'This is a valid post content.',
      category_id: validCategoryId
    }
    const result = postSchema.safeParse(validPost)
    expect(result.success).toBe(true)
  })

  it('should reject empty content', () => {
    const invalidPost = {
      content: '',
      category_id: validCategoryId
    }
    const result = postSchema.safeParse(invalidPost)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El post no puede estar vacío')
    }
  })

  it('should reject content exceeding maximum length', () => {
    const invalidPost = {
      content: 'a'.repeat(POST_MAX_LENGTH + 1),
      category_id: validCategoryId
    }
    const result = postSchema.safeParse(invalidPost)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(`Máximo ${POST_MAX_LENGTH} caracteres`)
    }
  })

  it('should reject invalid category_id (not a UUID)', () => {
    const invalidPost = {
      content: 'Valid content',
      category_id: 'not-a-uuid'
    }
    const result = postSchema.safeParse(invalidPost)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Categoría requerida')
    }
  })

  it('should reject missing fields', () => {
    expect(postSchema.safeParse({ content: 'only content' }).success).toBe(false)
    expect(postSchema.safeParse({ category_id: validCategoryId }).success).toBe(false)
  })
})
