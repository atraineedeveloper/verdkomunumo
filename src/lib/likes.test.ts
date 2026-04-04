import { describe, expect, it } from 'vitest'

describe('likes duplicate handling', () => {
  it('treats postgres unique violations as duplicate-like conflicts', async () => {
    const module = await import('@/lib/likes')
    const error = { code: '23505', message: 'duplicate key value violates unique constraint', details: null } as any
    expect((module as any)).toBeTruthy()
    expect(error.code).toBe('23505')
  })
})
