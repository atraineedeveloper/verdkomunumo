import { describe, expect, it, vi, beforeEach } from 'vitest'

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession,
    },
  },
}))

import { exchangeAuthCallbackCode } from '@/pages/auth/AuthCallback'

describe('exchangeAuthCallbackCode', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset()
  })

  it('treats missing codes as a no-op success', async () => {
    await expect(exchangeAuthCallbackCode(null)).resolves.toEqual({ ok: true })
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('returns failure when the session exchange fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error('boom') })

    await expect(exchangeAuthCallbackCode('bad-code')).resolves.toEqual({ ok: false })
  })

  it('returns success when the session exchange succeeds', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    await expect(exchangeAuthCallbackCode('good-code')).resolves.toEqual({ ok: true })
    expect(exchangeCodeForSession).toHaveBeenCalledWith('good-code')
  })
})
