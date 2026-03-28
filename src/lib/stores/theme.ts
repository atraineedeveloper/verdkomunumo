import { writable } from 'svelte/store'
import type { Theme } from '$lib/types'

const STORAGE_KEY = 'verdkomunumo-theme'

function createThemeStore() {
  const { subscribe, set } = writable<Theme>('green')

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      set(theme)
      if (typeof document !== 'undefined') {
        document.documentElement.className = `theme-${theme}`
        localStorage.setItem(STORAGE_KEY, theme)
      }
    },
    init: () => {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
        if (saved) {
          set(saved)
          document.documentElement.className = `theme-${saved}`
        }
      }
    }
  }
}

export const themeStore = createThemeStore()
