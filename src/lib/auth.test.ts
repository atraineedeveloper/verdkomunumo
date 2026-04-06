import { beforeEach, describe, expect, it, vi } from 'vitest'

const { signInWithPassword, setSession, invoke } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  setSession: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword,
      setSession,
    },
    functions: {
      invoke,
    },
  },
}))

import { looksLikeEmail, signInWithIdentifier } from '@/lib/auth'

describe('looksLikeEmail', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
    setSession.mockReset()
    invoke.mockReset()
  })

  it('detects valid emails', () => {
    expect(looksLikeEmail('ana@example.com')).toBe(true)
    expect(looksLikeEmail(' ANA@example.com ')).toBe(true)
  })

  it('rejects usernames', () => {
    expect(looksLikeEmail('ana_verda')).toBe(false)
    expect(looksLikeEmail('verdkomunumo')).toBe(false)
  })

  it('signs in with password directly for emails', async () => {
    signInWithPassword.mockResolvedValue({ error: null })

    await signInWithIdentifier(' Ana@example.com ', 'secret-pass')

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'secret-pass',
    })
    expect(invoke).not.toHaveBeenCalled()
    expect(setSession).not.toHaveBeenCalled()
  })

  it('uses the edge function for usernames and stores the session', async () => {
    invoke.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-1',
          refresh_token: 'token-2',
        },
      },
      error: null,
    })
    setSession.mockResolvedValue({ error: null })

    await signInWithIdentifier('ada', 'secret-pass')

    expect(invoke).toHaveBeenCalledWith('login-with-identifier', {
      body: {
        identifier: 'ada',
        password: 'secret-pass',
      },
    })
    expect(setSession).toHaveBeenCalledWith({
      access_token: 'token-1',
      refresh_token: 'token-2',
    })
  })

  it('returns a generic error for invalid username credentials', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new Error('Invalid login credentials'),
    })

    await expect(signInWithIdentifier('nope', 'secret-pass')).rejects.toThrow('Nevalidaj ensalutaj datumoj.')
  })
})
