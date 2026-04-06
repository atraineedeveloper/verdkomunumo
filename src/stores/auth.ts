import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  initialized: boolean
  profileLoaded: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setInitialized: (value: boolean) => void
  setProfileLoaded: (value: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  initialized: false,
  profileLoaded: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (initialized) => set({ initialized }),
  setProfileLoaded: (profileLoaded) => set({ profileLoaded }),
  clear: () => set({ user: null, profile: null, initialized: true, profileLoaded: true }),
}))
