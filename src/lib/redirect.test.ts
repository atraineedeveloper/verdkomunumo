import { describe, expect, it } from 'vitest'
import { safeRedirect } from '@/lib/redirect'
import { routes } from '@/lib/routes'

describe('safeRedirect', () => {
  it('accepts internal application routes', () => {
    expect(safeRedirect('/fonto')).toBe('/fonto')
    expect(safeRedirect('/profilo/ada?tab=posts#latest')).toBe('/profilo/ada?tab=posts#latest')
  })

  it('rejects external or malformed targets', () => {
    expect(safeRedirect('https://evil.example/login')).toBe(routes.feed)
    expect(safeRedirect('//evil.example')).toBe(routes.feed)
    expect(safeRedirect('javascript:alert(1)')).toBe(routes.feed)
    expect(safeRedirect('')).toBe(routes.feed)
    expect(safeRedirect('/\\evil')).toBe(routes.feed)
  })
})
