import type { NotificationType } from '@/lib/types'

// Types that warrant a browser push notification. Likes stay excluded because they are too noisy.
const NOTIFIABLE_TYPES = new Set<NotificationType>(['comment', 'follow', 'mention', 'message', 'quote'])

export function shouldNotify(type: NotificationType): boolean {
  return NOTIFIABLE_TYPES.has(type)
}

export function isTabVisible(): boolean {
  return document.visibilityState === 'visible'
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: `verdkomunumo-${Date.now()}`,
  })
  if (onClick) n.onclick = () => {
    window.focus()
    n.close()
    onClick()
  }
}
