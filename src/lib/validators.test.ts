import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  postSchema,
  commentSchema,
  messageSchema,
  profileEditSchema,
  appSuggestionSchema,
  contentReportSchema,
  categoryAdminSchema
} from './validators'
import { POST_MAX_LENGTH, COMMENT_MAX_LENGTH, MESSAGE_MAX_LENGTH } from './constants'

describe('Validators', () => {
  describe('registerSchema', () => {
    it('accepts valid input', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        username: 'valid_username',
        display_name: 'Valid User'
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
        username: 'valid_username',
        display_name: 'Valid User'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email no válido')
      }
    })

    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        username: 'valid_username',
        display_name: 'Valid User'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mínimo 8 caracteres')
      }
    })

    it('rejects invalid username length', () => {
      const shortResult = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        username: 'ab',
        display_name: 'Valid User'
      })
      expect(shortResult.success).toBe(false)

      const longResult = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        username: 'a'.repeat(31),
        display_name: 'Valid User'
      })
      expect(longResult.success).toBe(false)
    })

    it('rejects invalid username characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        username: 'Invalid-Username!',
        display_name: 'Valid User'
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing display_name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        username: 'valid_username',
        display_name: ''
      })
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('accepts valid input', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123'
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: ''
      })
      expect(result.success).toBe(false)
    })
  })

  describe('postSchema', () => {
    it('accepts valid input', () => {
      const result = postSchema.safeParse({
        content: 'This is a valid post content.',
        category_id: '550e8400-e29b-41d4-a716-446655440000'
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty content', () => {
      const result = postSchema.safeParse({
        content: '',
        category_id: '550e8400-e29b-41d4-a716-446655440000'
      })
      expect(result.success).toBe(false)
    })

    it('rejects content exceeding max length', () => {
      const result = postSchema.safeParse({
        content: 'a'.repeat(POST_MAX_LENGTH + 1),
        category_id: '550e8400-e29b-41d4-a716-446655440000'
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid category_id uuid', () => {
      const result = postSchema.safeParse({
        content: 'Valid content',
        category_id: 'invalid-uuid'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('commentSchema', () => {
    it('accepts valid input without parent_id', () => {
      const result = commentSchema.safeParse({
        content: 'Valid comment content.'
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid input with parent_id', () => {
      const result = commentSchema.safeParse({
        content: 'Valid comment content.',
        parent_id: '550e8400-e29b-41d4-a716-446655440000'
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty content', () => {
      const result = commentSchema.safeParse({
        content: ''
      })
      expect(result.success).toBe(false)
    })

    it('rejects content exceeding max length', () => {
      const result = commentSchema.safeParse({
        content: 'a'.repeat(COMMENT_MAX_LENGTH + 1)
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid parent_id uuid', () => {
      const result = commentSchema.safeParse({
        content: 'Valid comment content',
        parent_id: 'invalid-uuid'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('messageSchema', () => {
    it('accepts valid input', () => {
      const result = messageSchema.safeParse({
        content: 'Valid message content'
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty content', () => {
      const result = messageSchema.safeParse({
        content: ''
      })
      expect(result.success).toBe(false)
    })

    it('rejects content exceeding max length', () => {
      const result = messageSchema.safeParse({
        content: 'a'.repeat(MESSAGE_MAX_LENGTH + 1)
      })
      expect(result.success).toBe(false)
    })
  })

  describe('profileEditSchema', () => {
    it('accepts valid input with all fields', () => {
      const result = profileEditSchema.safeParse({
        username: 'valid_user',
        display_name: 'Valid User',
        bio: 'This is a bio',
        website: 'https://example.com',
        location: 'Earth',
        esperanto_level: 'progresanto'
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid input with only required fields', () => {
      const result = profileEditSchema.safeParse({
        username: 'valid_user',
        display_name: 'Valid User',
        esperanto_level: 'komencanto'
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid username', () => {
      const result = profileEditSchema.safeParse({
        username: 'Invalid User!',
        display_name: 'Valid User',
        esperanto_level: 'komencanto'
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid website url', () => {
      const result = profileEditSchema.safeParse({
        username: 'valid_user',
        display_name: 'Valid User',
        esperanto_level: 'komencanto',
        website: 'not-a-url'
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid esperanto_level', () => {
      const result = profileEditSchema.safeParse({
        username: 'valid_user',
        display_name: 'Valid User',
        esperanto_level: 'invalid_level'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('appSuggestionSchema', () => {
    it('accepts valid input without context', () => {
      const result = appSuggestionSchema.safeParse({
        title: 'Great suggestion',
        description: 'This is a very detailed description for the suggestion.'
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid input with context', () => {
      const result = appSuggestionSchema.safeParse({
        title: 'Great suggestion',
        description: 'This is a very detailed description for the suggestion.',
        context: 'Found an issue while browsing the feed.'
      })
      expect(result.success).toBe(true)
    })

    it('rejects short title', () => {
      const result = appSuggestionSchema.safeParse({
        title: 'sh',
        description: 'This is a very detailed description for the suggestion.'
      })
      expect(result.success).toBe(false)
    })

    it('rejects short description', () => {
      const result = appSuggestionSchema.safeParse({
        title: 'Great suggestion',
        description: 'short'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('contentReportSchema', () => {
    it('accepts reporting a post', () => {
      const result = contentReportSchema.safeParse({
        post_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'spam'
      })
      expect(result.success).toBe(true)
    })

    it('accepts reporting a comment', () => {
      const result = contentReportSchema.safeParse({
        comment_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'harassment'
      })
      expect(result.success).toBe(true)
    })

    it('rejects reporting both post and comment', () => {
      const result = contentReportSchema.safeParse({
        post_id: '550e8400-e29b-41d4-a716-446655440000',
        comment_id: '550e8400-e29b-41d4-a716-446655440001',
        reason: 'spam'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Debes reportar exactamente una publicación o un comentario.')
      }
    })

    it('rejects reporting neither post nor comment', () => {
      const result = contentReportSchema.safeParse({
        reason: 'spam'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Debes reportar exactamente una publicación o un comentario.')
      }
    })

    it('rejects invalid reason', () => {
      const result = contentReportSchema.safeParse({
        post_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'invalid_reason'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('categoryAdminSchema', () => {
    it('accepts valid input', () => {
      const result = categoryAdminSchema.safeParse({
        name: 'Valid Name',
        slug: 'valid-slug-123',
        description: 'A valid description.',
        icon: 'icon-name',
        color: '#ff00ff',
        sort_order: 1
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid slug format', () => {
      const result = categoryAdminSchema.safeParse({
        name: 'Valid Name',
        slug: 'Invalid Slug!',
        description: 'A valid description.',
        color: '#ff00ff',
        sort_order: 1
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid hex color', () => {
      const result = categoryAdminSchema.safeParse({
        name: 'Valid Name',
        slug: 'valid-slug',
        description: 'A valid description.',
        color: 'blue',
        sort_order: 1
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative sort_order', () => {
      const result = categoryAdminSchema.safeParse({
        name: 'Valid Name',
        slug: 'valid-slug',
        description: 'A valid description.',
        color: '#ff00ff',
        sort_order: -1
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer sort_order', () => {
      const result = categoryAdminSchema.safeParse({
        name: 'Valid Name',
        slug: 'valid-slug',
        description: 'A valid description.',
        color: '#ff00ff',
        sort_order: 1.5
      })
      expect(result.success).toBe(false)
    })
  })
})
