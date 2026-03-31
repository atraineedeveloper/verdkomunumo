import type { UserRole } from '@/lib/types'

const MANAGEABLE_ROLES: UserRole[] = ['user', 'moderator', 'admin', 'owner']

export function normalizeAdminRoleFilter(input?: string | null): UserRole | 'all' {
  if (!input || input === 'all') return 'all'
  return MANAGEABLE_ROLES.includes(input as UserRole) ? (input as UserRole) : 'all'
}

export function getPaginationRange(page: number, pageSize: number, total: number) {
  if (total <= 0) return { start: 0, end: 0, totalPages: 1 }

  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, pageSize)
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))

  return {
    start: (safePage - 1) * safePageSize + 1,
    end: Math.min(safePage * safePageSize, total),
    totalPages,
  }
}
