import { describe, expect, it } from 'vitest'
import { shouldShowReadMore } from '@/lib/postExcerpt'

describe('shouldShowReadMore', () => {
  it('returns false for short content', () => {
    expect(shouldShowReadMore('Mallonga afiŝo')).toBe(false)
  })

  it('returns true when content exceeds the character threshold', () => {
    expect(shouldShowReadMore('a'.repeat(500), { maxChars: 120 })).toBe(true)
  })

  it('returns true when content exceeds the line threshold', () => {
    expect(shouldShowReadMore('1\n2\n3\n4', { maxLines: 3, maxChars: 500 })).toBe(true)
  })
})
