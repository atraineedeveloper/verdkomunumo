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
