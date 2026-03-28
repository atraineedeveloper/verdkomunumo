import { writable, derived } from 'svelte/store'
import type { Notification } from '$lib/types'

export const notifications = writable<Notification[]>([])

export const unreadCount = derived(
  notifications,
  ($notifications) => $notifications.filter((n) => !n.is_read).length
)
