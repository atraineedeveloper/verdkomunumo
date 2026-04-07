import type { Profile } from '@/lib/types'

export const PRESENCE_TIMEOUT_MS = 2 * 60 * 1000

export interface ActiveUserPresence {
  user_id: string
  username: string
  display_name: string
  avatar_url: string
  last_seen_at: string
}

export type PresenceStatePayload = Record<string, ActiveUserPresence[]>

export function isPresenceOnline(lastSeenAt: string | null | undefined, now = Date.now()) {
  if (!lastSeenAt) return false
  const lastSeen = Date.parse(lastSeenAt)
  if (Number.isNaN(lastSeen)) return false
  return now - lastSeen <= PRESENCE_TIMEOUT_MS
}

export function getActivePresenceMap(state: PresenceStatePayload, now = Date.now()) {
  const activeUsers: Record<string, ActiveUserPresence> = {}

  for (const entries of Object.values(state)) {
    for (const entry of entries ?? []) {
      if (!entry?.user_id || !isPresenceOnline(entry.last_seen_at, now)) continue

      const current = activeUsers[entry.user_id]
      if (!current || Date.parse(entry.last_seen_at) > Date.parse(current.last_seen_at)) {
        activeUsers[entry.user_id] = entry
      }
    }
  }

  return activeUsers
}

export function sortActiveUsers(users: ActiveUserPresence[]) {
  return [...users].sort((left, right) => {
    const nameCompare = left.display_name.localeCompare(right.display_name, undefined, { sensitivity: 'base' })
    if (nameCompare !== 0) return nameCompare
    return left.username.localeCompare(right.username, undefined, { sensitivity: 'base' })
  })
}

export function buildPresencePayload(profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>): ActiveUserPresence {
  return {
    user_id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    last_seen_at: new Date().toISOString(),
  }
}
