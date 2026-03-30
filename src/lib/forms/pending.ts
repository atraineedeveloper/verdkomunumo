import { applyAction } from '$app/forms'
import type { SubmitFunction } from '@sveltejs/kit'
import { beginNetworkTask, endNetworkTask } from '$lib/stores/network'

export function withPendingAction(factory?: SubmitFunction): SubmitFunction {
  return async (...originalArgs) => {
    beginNetworkTask()

    try {
      const submitInput = originalArgs[0]
      let cancelled = false

      const wrappedArgs = submitInput
        ? [
            {
              ...submitInput,
              cancel: () => {
                cancelled = true
                endNetworkTask()
                submitInput.cancel()
              }
            }
          ] as Parameters<SubmitFunction>
        : originalArgs

      const callback = await factory?.(...wrappedArgs)

      if (cancelled) {
        return
      }

      if (!callback) {
        return async ({ result }) => {
          try {
            await applyAction(result)
          } finally {
            endNetworkTask()
          }
        }
      }

      return async (input) => {
        try {
          await callback(input)
        } finally {
          endNetworkTask()
        }
      }
    } catch (error) {
      endNetworkTask()
      throw error
    }
  }
}
