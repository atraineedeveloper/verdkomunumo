import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info' | 'interaction'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
  duration: number
  iconName?: string
}

let nextToastId = 1

interface ToastState {
  toasts: Toast[]
  remove: (id: number) => void
  push: (message: string, tone?: ToastTone, duration?: number, iconName?: string) => number
  success: (message: string, duration?: number) => number
  error: (message: string, duration?: number) => number
  info: (message: string, duration?: number) => number
  interaction: (message: string, iconName: string, duration?: number) => number
}

export const useToastStore = create<ToastState>((set, get) => {
  function remove(id: number) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  }

  function push(message: string, tone: ToastTone = 'info', duration?: number, iconName?: string): number {
    const d = duration ?? (tone === 'error' ? 5200 : (tone === 'interaction' ? 6000 : 3200))
    const toast: Toast = { id: nextToastId++, tone, message, duration: d, iconName }
    set((state) => ({ toasts: [...state.toasts, toast] }))
    window.setTimeout(() => get().remove(toast.id), d)
    return toast.id
  }

  return {
    toasts: [],
    remove,
    push,
    success: (message, duration) => push(message, 'success', duration),
    error: (message, duration) => push(message, 'error', duration),
    info: (message, duration) => push(message, 'info', duration),
    interaction: (message, iconName, duration) => push(message, 'interaction', duration, iconName),
  }
})
