import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc,
  },
}))

import { assertUsernameAvailable } from '@/lib/username'

describe('assertUsernameAvailable', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('resolves silently when the username is available', async () => {
    rpc.mockResolvedValue({ data: true, error: null })

    await expect(assertUsernameAvailable('ada')).resolves.toBeUndefined()

    expect(rpc).toHaveBeenCalledWith('is_username_available', {
      check_username: 'ada',
      exclude_id: null,
    })
  })

  it('passes exclude_id when checking during an edit', async () => {
    rpc.mockResolvedValue({ data: true, error: null })

    await assertUsernameAvailable('ada', 'user-1')

    expect(rpc).toHaveBeenCalledWith('is_username_available', {
      check_username: 'ada',
      exclude_id: 'user-1',
    })
  })

  it('throws a friendly error when the username is taken, including by a hidden profile', async () => {
    rpc.mockResolvedValue({ data: false, error: null })

    await expect(assertUsernameAvailable('ada')).rejects.toThrow('Tiu uzantnomo jam estas uzata')
  })

  it('surfaces the RPC error message when the call itself fails', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('network down') })

    await expect(assertUsernameAvailable('ada')).rejects.toThrow('network down')
  })
})
