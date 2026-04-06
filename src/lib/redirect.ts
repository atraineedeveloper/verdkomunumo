import { routes } from '@/lib/routes'

export function safeRedirect(target: string | null | undefined, fallback = routes.feed) {
  if (!target) return fallback

  const normalized = target.trim()
  if (!normalized.startsWith('/') || normalized.startsWith('//') || normalized.includes('\\')) {
    return fallback
  }

  try {
    const parsed = new URL(normalized, 'https://verdkomunumo.local')
    if (parsed.origin !== 'https://verdkomunumo.local') {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
