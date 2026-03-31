import { create } from 'zustand'
import type { Notification } from '@/lib/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: () => number
  setNotifications: (notifications: Notification[]) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: () => get().notifications.filter((n) => !n.is_read).length,
  setNotifications: (notifications) => set({ notifications }),
}))
