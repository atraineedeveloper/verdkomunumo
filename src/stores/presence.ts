import { create } from 'zustand'
import type { ActiveUserPresence } from '@/lib/presence'

interface PresenceState {
  activeUsers: Record<string, ActiveUserPresence>
  setActiveUsers: (activeUsers: Record<string, ActiveUserPresence>) => void
  clear: () => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  activeUsers: {},
  setActiveUsers: (activeUsers) => set({ activeUsers }),
  clear: () => set({ activeUsers: {} }),
}))
