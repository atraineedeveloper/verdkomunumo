import { describe, expect, it } from 'vitest'
import { mergeCommunityMessages, normalizeCommunityMessages } from '@/lib/communityChat'

describe('normalizeCommunityMessages', () => {
  it('keeps the most recent 50 messages in ascending order', () => {
    const messages = Array.from({ length: 55 }, (_, index) => ({
      id: `msg-${index + 1}`,
      created_at: `2026-04-06T12:${String(index).padStart(2, '0')}:00.000Z`,
    }))

    const normalized = normalizeCommunityMessages(messages as any)

    expect(normalized).toHaveLength(50)
    expect(normalized[0]?.id).toBe('msg-6')
    expect(normalized[normalized.length - 1]?.id).toBe('msg-55')
  })
})

describe('mergeCommunityMessages', () => {
  it('replaces optimistic messages with the persisted realtime version using client_nonce', () => {
    const current = [
      {
        id: 'optimistic-1',
        user_id: 'user-1',
        content: 'Saluton',
        client_nonce: 'nonce-1',
        created_at: '2026-04-06T12:00:00.000Z',
      },
    ]

    const next = mergeCommunityMessages(current as any, {
      id: 'db-1',
      user_id: 'user-1',
      content: 'Saluton',
      client_nonce: 'nonce-1',
      created_at: '2026-04-06T12:00:01.000Z',
    } as any)

    expect(next).toEqual([
      {
        id: 'db-1',
        user_id: 'user-1',
        content: 'Saluton',
        client_nonce: 'nonce-1',
        created_at: '2026-04-06T12:00:01.000Z',
      },
    ])
  })

  it('deduplicates persisted messages by id while preserving order', () => {
    const current = [
      {
        id: 'db-1',
        user_id: 'user-1',
        content: 'Saluton',
        created_at: '2026-04-06T12:00:01.000Z',
      },
    ]

    expect(mergeCommunityMessages(current as any, {
      id: 'db-1',
      user_id: 'user-1',
      content: 'Saluton',
      created_at: '2026-04-06T12:00:01.000Z',
    } as any)).toEqual(current)
  })
})
