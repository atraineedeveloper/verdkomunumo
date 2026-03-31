import { create } from 'zustand'
import type { Theme } from '@/lib/types'

const STORAGE_KEY = 'verdkomunumo-theme'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'green',
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.className = `theme-${theme}`
    localStorage.setItem(STORAGE_KEY, theme)
  },
  init: () => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const theme = saved ?? 'green'
    set({ theme })
    document.documentElement.className = `theme-${theme}`
  },
}))
