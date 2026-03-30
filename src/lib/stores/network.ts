import { derived, writable } from 'svelte/store'

const pendingRequests = writable(0)

export const networkBusy = derived(pendingRequests, ($pendingRequests) => $pendingRequests > 0)

export function beginNetworkTask() {
  pendingRequests.update((count) => count + 1)
}

export function endNetworkTask() {
  pendingRequests.update((count) => Math.max(0, count - 1))
}
