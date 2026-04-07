import { describe, expect, it } from 'vitest'
import { sanitizeHttpUrl, sanitizeLinkPreview } from '@/lib/linkPreview'

describe('sanitizeHttpUrl', () => {
  it('allows http and https URLs', () => {
    expect(sanitizeHttpUrl('https://example.com/post')).toBe('https://example.com/post')
    expect(sanitizeHttpUrl('http://example.com/image.png')).toBe('http://example.com/image.png')
  })

  it('rejects unsafe protocols', () => {
    expect(sanitizeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeHttpUrl('data:text/html;base64,SGk=')).toBeNull()
  })
})

describe('sanitizeLinkPreview', () => {
  it('drops previews with unsafe destination URLs', () => {
    expect(sanitizeLinkPreview({ url: 'javascript:alert(1)', image: 'https://example.com/i.png' })).toBeNull()
  })

  it('removes unsafe image URLs while preserving preview data', () => {
    expect(
      sanitizeLinkPreview({
        url: 'https://example.com/story',
        title: 'Title',
        image: 'data:text/html;base64,SGk=',
      }),
    ).toEqual({
      url: 'https://example.com/story',
      title: 'Title',
      image: undefined,
    })
  })
})
