import { writable } from 'svelte/store'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
  duration: number
}

let nextToastId = 1

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([])

  function remove(id: number) {
    update((items) => items.filter((item) => item.id !== id))
  }

  function push(
    message: string,
    tone: ToastTone = 'info',
    duration = tone === 'error' ? 5200 : 3200
  ) {
    const toast: Toast = {
      id: nextToastId++,
      tone,
      message,
      duration
    }

    update((items) => [...items, toast])

    if (typeof window !== 'undefined') {
      window.setTimeout(() => remove(toast.id), toast.duration)
    }

    return toast.id
  }

  return {
    subscribe,
    remove,
    push,
    success: (message: string, duration?: number) => push(message, 'success', duration),
    error: (message: string, duration?: number) => push(message, 'error', duration),
    info: (message: string, duration?: number) => push(message, 'info', duration)
  }
}

export const toastStore = createToastStore()
