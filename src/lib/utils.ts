import { X_SYSTEM_MAP } from './constants'

export function applyXSystem(text: string): string {
  return text.replace(/[cCgGhHjJsStTuU]x/g, (match) => X_SYSTEM_MAP[match] ?? match)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'ĵus nun'
  if (minutes < 60) return `antaŭ ${minutes}m`
  if (hours < 24) return `antaŭ ${hours}h`
  if (days < 7) return `antaŭ ${days}t`
  return date.toLocaleDateString('eo', { day: 'numeric', month: 'short' })
}

export function getAvatarUrl(avatarUrl: string | null, displayName: string): string {
  if (avatarUrl) return avatarUrl
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1B7A4A&color=fff`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ĉ]/g, 'c')
    .replace(/[ĝ]/g, 'g')
    .replace(/[ĥ]/g, 'h')
    .replace(/[ĵ]/g, 'j')
    .replace(/[ŝ]/g, 's')
    .replace(/[ŭ]/g, 'u')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}
