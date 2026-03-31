import { create } from 'zustand'

interface NetworkState {
  pendingRequests: number
  networkBusy: () => boolean
  beginNetworkTask: () => void
  endNetworkTask: () => void
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  pendingRequests: 0,
  networkBusy: () => get().pendingRequests > 0,
  beginNetworkTask: () => set((state) => ({ pendingRequests: state.pendingRequests + 1 })),
  endNetworkTask: () => set((state) => ({ pendingRequests: Math.max(0, state.pendingRequests - 1) })),
}))
