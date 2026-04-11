import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import * as Sentry from '@sentry/react'

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
  captureException: vi.fn(),
}))

describe('monitoring', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not initialize Sentry if disabled', async () => {
    vi.resetModules()
    vi.stubEnv('PROD', false as any)
    vi.stubEnv('VITE_SENTRY_DSN', '')

    const { initMonitoring } = await import('./monitoring')
    initMonitoring()

    expect(Sentry.init).not.toHaveBeenCalled()
  })

  it('initializes Sentry if enabled', async () => {
    vi.resetModules()
    vi.stubEnv('PROD', true as any)
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/123')
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', '0.5')
    vi.stubEnv('VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE', '0.2')
    vi.stubEnv('VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE', '0.8')

    const { initMonitoring } = await import('./monitoring')
    initMonitoring()

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://example@sentry.io/123',
      environment: 'production',
      tracesSampleRate: 0.5,
      replaysSessionSampleRate: 0.2,
      replaysOnErrorSampleRate: 0.8,
    }))
  })

  it('initializes Sentry with default values if environment variables are not provided', async () => {
    vi.resetModules()
    // Delete environment variables to test defaults for tracesSampleRate etc.
    vi.unstubAllEnvs()
    vi.stubEnv('PROD', true as any)
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/123')
    vi.stubEnv('MODE', 'production')

    // We want to verify `import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1` and similar logic
    // So we don't mock them in this test.

    const { initMonitoring } = await import('./monitoring')
    initMonitoring()

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://example@sentry.io/123',
      environment: 'production',
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1,
    }))
  })

  it('captureAppException does not capture exception if disabled', async () => {
    vi.resetModules()
    vi.stubEnv('PROD', false as any)
    vi.stubEnv('VITE_SENTRY_DSN', '')

    const { captureAppException } = await import('./monitoring')
    captureAppException(new Error('test error'))

    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('captureAppException captures exception if enabled', async () => {
    vi.resetModules()
    vi.stubEnv('PROD', true as any)
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/123')

    const { captureAppException } = await import('./monitoring')
    const error = new Error('test error')
    captureAppException(error, { userId: '123' })

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      extra: { userId: '123' }
    })
  })
})
