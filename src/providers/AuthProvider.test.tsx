import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/providers/AuthProvider'
import { useAuthStore } from '@/stores/auth'

const { getSession, onAuthStateChange, single, eq, select, from } = vi.hoisted(() => {
  const single = vi.fn()
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  return {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    single,
    eq,
    select,
    from,
  }
})

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange,
    },
    from,
  },
}))

describe('AuthProvider', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      initialized: false,
      profileLoaded: false,
    })

    getSession.mockReset()
    onAuthStateChange.mockReset()
    from.mockClear()
    select.mockClear()
    eq.mockClear()
    single.mockReset()
    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })
  })

  it('marks auth as ready when there is no active session', async () => {
    getSession.mockResolvedValue({ data: { session: null } })

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(useAuthStore.getState()).toMatchObject({
        user: null,
        profile: null,
        initialized: true,
        profileLoaded: true,
      })
    })
  })

  it('loads the profile before finishing initialization for active sessions', async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1' },
        },
      },
    })
    single.mockResolvedValue({
      data: {
        id: 'user-1',
        username: 'ada',
        role: 'admin',
      },
    })

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(useAuthStore.getState()).toMatchObject({
        user: { id: 'user-1' },
        profile: {
          id: 'user-1',
          username: 'ada',
          role: 'admin',
        },
        initialized: true,
        profileLoaded: true,
      })
    })

    expect(from).toHaveBeenCalledWith('profiles')
  })
})
