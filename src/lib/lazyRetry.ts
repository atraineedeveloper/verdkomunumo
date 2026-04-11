const RETRY_PREFIX = 'lazy-retry:'

function isDynamicImportError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')
  )
}

export async function lazyRetry<T>(importer: () => Promise<T>, key: string) {
  try {
    const module = await importer()
    sessionStorage.removeItem(`${RETRY_PREFIX}${key}`)
    return module
  } catch (error) {
    if (typeof window !== 'undefined' && isDynamicImportError(error)) {
      const storageKey = `${RETRY_PREFIX}${key}`
      const alreadyRetried = sessionStorage.getItem(storageKey) === '1'

      if (!alreadyRetried) {
        sessionStorage.setItem(storageKey, '1')
        window.location.reload()
        return new Promise<T>(() => undefined)
      }

      sessionStorage.removeItem(storageKey)
    }

    throw error
  }
}
