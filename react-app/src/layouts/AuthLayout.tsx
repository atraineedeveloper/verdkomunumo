import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { routes } from '@/lib/routes'
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner'

export function AuthLayout() {
  const { user, initialized } = useAuthStore()

  if (!initialized) {
    return <FullScreenSpinner label="Loading authentication" />
  }
  if (user) return <Navigate to={routes.feed} replace />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8 bg-[var(--color-bg)]">
      {/* Brand */}
      <div className="text-center">
        <div className="text-[3rem] leading-none text-[var(--color-primary)] mb-2">★</div>
        <h1 className="text-[1.5rem] font-bold text-[var(--color-primary)] m-0">{APP_NAME}</h1>
        <p className="text-[0.875rem] text-[var(--color-text-muted)] mt-1 mb-0">{APP_TAGLINE}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[1rem] p-8 shadow-[0_4px_24px_var(--color-shadow,rgba(0,0,0,0.06))]">
        <Outlet />
      </div>
    </div>
  )
}
