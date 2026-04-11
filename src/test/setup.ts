import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

if (
  typeof window !== 'undefined' &&
  (!window.localStorage || typeof window.localStorage.getItem !== 'function')
) {
  let store = new Map<string, string>()

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value))
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store = new Map<string, string>()
      },
    },
  })
}

afterEach(() => {
  cleanup()
})

// Automatically stub Supabase environment variables for testing environment if not provided
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321'
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'fake-anon-key'
}
