import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { queryClient } from '@/lib/query/client'
import { initMonitoring } from '@/lib/monitoring'
import { AuthProvider } from '@/providers/AuthProvider'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import App from './App'
import './lib/i18n'
import './app.css'

initMonitoring()

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : null

function QueryDevtools() {
  if (!ReactQueryDevtools) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} />
    </Suspense>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </AppErrorBoundary>
        <Analytics />
        <SpeedInsights />

      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)
