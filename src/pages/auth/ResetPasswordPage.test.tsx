import { beforeEach, describe, expect, it, vi } from 'vitest'

const { exchangeCodeForSession, getSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession,
      getSession,
    },
  },
}))

import { resolveResetPasswordSession } from '@/pages/auth/ResetPasswordPage'

describe('resolveResetPasswordSession', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset()
    getSession.mockReset()
  })

  it('returns an invalid-link error when there is no recovery session', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null })

    await expect(resolveResetPasswordSession(null)).resolves.toEqual({
      ready: false,
      error: 'La restariga ligilo ne plu validas aŭ jam estis uzita.',
    })
  })

  it('returns a validation error when the recovery code fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error('invalid') })

    await expect(resolveResetPasswordSession('bad-code')).resolves.toEqual({
      ready: false,
      error: 'Ne eblis validigi la ligilon por restarigo.',
    })
  })

  it('returns ready when a recovery session exists', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })
    getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null })

    await expect(resolveResetPasswordSession('good-code')).resolves.toEqual({
      ready: true,
      error: null,
    })
  })
})
