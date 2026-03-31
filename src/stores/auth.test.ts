import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      initialized: false,
    })
  })

  it('keeps the store initialized after clear', () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as never,
      profile: { id: 'user-1', username: 'ada' } as never,
      initialized: true,
    })

    useAuthStore.getState().clear()

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      profile: null,
      initialized: true,
    })
  })
})
