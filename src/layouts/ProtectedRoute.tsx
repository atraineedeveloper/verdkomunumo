import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth'
import { routes } from '@/lib/routes'
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, initialized } = useAuthStore()
  const { pathname, search, hash } = useLocation()

  // Wait for auth to initialize before deciding
  if (!initialized) {
    return <FullScreenSpinner label="Loading session" />
  }

  if (!user) {
    return <Navigate to={`${routes.login}?next=${encodeURIComponent(`${pathname}${search}${hash}`)}`} replace />
  }

  return <>{children}</>
}
