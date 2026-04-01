import { describe, expect, it } from 'vitest'
import { looksLikeEmail } from '@/lib/auth'

describe('looksLikeEmail', () => {
  it('detects valid emails', () => {
    expect(looksLikeEmail('ana@example.com')).toBe(true)
    expect(looksLikeEmail(' ANA@example.com ')).toBe(true)
  })

  it('rejects usernames', () => {
    expect(looksLikeEmail('ana_verda')).toBe(false)
    expect(looksLikeEmail('verdkomunumo')).toBe(false)
  })
})
