import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth'
import { hasRequiredRole } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { routes } from '@/lib/routes'
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner'

interface ProtectedRouteProps {
  children: ReactNode
  minRole?: UserRole
}

export function ProtectedRoute({ children, minRole = 'user' }: ProtectedRouteProps) {
  const { user, profile, initialized } = useAuthStore()
  const { pathname } = useLocation()

  // Wait for auth to initialize before deciding
  if (!initialized) {
    return <FullScreenSpinner label="Loading session" />
  }

  if (!user) {
    return <Navigate to={`${routes.login}?next=${encodeURIComponent(pathname)}`} replace />
  }

  if (profile && minRole !== 'user' && !hasRequiredRole(profile.role, minRole)) {
    return <Navigate to={routes.feed} replace />
  }

  return <>{children}</>
}
