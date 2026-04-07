import { describe, expect, it } from 'vitest'
import { getActivePresenceMap, isPresenceOnline, sortActiveUsers, type PresenceStatePayload } from '@/lib/presence'

describe('isPresenceOnline', () => {
  it('treats users as active within the two minute window', () => {
    expect(isPresenceOnline('2026-04-06T12:00:30.000Z', Date.parse('2026-04-06T12:02:00.000Z'))).toBe(true)
  })

  it('treats users as inactive after the two minute window or invalid timestamps', () => {
    expect(isPresenceOnline('2026-04-06T12:00:00.000Z', Date.parse('2026-04-06T12:02:01.000Z'))).toBe(false)
    expect(isPresenceOnline('not-a-date', Date.parse('2026-04-06T12:02:01.000Z'))).toBe(false)
  })
})

describe('getActivePresenceMap', () => {
  it('keeps the freshest presence record per user and removes stale entries', () => {
    const state: PresenceStatePayload = {
      'user-1': [
        {
          user_id: 'user-1',
          username: 'ana',
          display_name: 'Ana',
          avatar_url: '',
          last_seen_at: '2026-04-06T12:01:50.000Z',
        },
      ],
      'old-ref': [
        {
          user_id: 'user-1',
          username: 'ana',
          display_name: 'Ana Older',
          avatar_url: '',
          last_seen_at: '2026-04-06T12:01:10.000Z',
        },
      ],
      'user-2': [
        {
          user_id: 'user-2',
          username: 'berto',
          display_name: 'Berto',
          avatar_url: '',
          last_seen_at: '2026-04-06T11:55:00.000Z',
        },
      ],
    }

    expect(getActivePresenceMap(state, Date.parse('2026-04-06T12:02:00.000Z'))).toEqual({
      'user-1': {
        user_id: 'user-1',
        username: 'ana',
        display_name: 'Ana',
        avatar_url: '',
        last_seen_at: '2026-04-06T12:01:50.000Z',
      },
    })
  })
})

describe('sortActiveUsers', () => {
  it('sorts active users alphabetically by display name and then username', () => {
    expect(sortActiveUsers([
      {
        user_id: '2',
        username: 'lina',
        display_name: 'Lina',
        avatar_url: '',
        last_seen_at: '2026-04-06T12:01:50.000Z',
      },
      {
        user_id: '1',
        username: 'ada',
        display_name: 'Ada',
        avatar_url: '',
        last_seen_at: '2026-04-06T12:01:55.000Z',
      },
    ]).map((user) => user.user_id)).toEqual(['1', '2'])
  })
})
