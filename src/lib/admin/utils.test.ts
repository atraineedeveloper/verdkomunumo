import { describe, expect, it } from 'vitest'
import { getPaginationRange, normalizeAdminRoleFilter } from './utils'

describe('admin utils', () => {
  it('normalizes admin role filters safely', () => {
    expect(normalizeAdminRoleFilter()).toBe('all')
    expect(normalizeAdminRoleFilter('all')).toBe('all')
    expect(normalizeAdminRoleFilter('moderator')).toBe('moderator')
    expect(normalizeAdminRoleFilter('nonsense')).toBe('all')
  })

  it('computes pagination ranges for admin tables', () => {
    expect(getPaginationRange(1, 20, 0)).toEqual({ start: 0, end: 0, totalPages: 1 })
    expect(getPaginationRange(2, 20, 45)).toEqual({ start: 21, end: 40, totalPages: 3 })
    expect(getPaginationRange(3, 20, 45)).toEqual({ start: 41, end: 45, totalPages: 3 })
  })
})
