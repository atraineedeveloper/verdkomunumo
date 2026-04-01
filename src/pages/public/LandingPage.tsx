import { Navigate } from 'react-router-dom'
import { routes } from '@/lib/routes'

export default function LandingPage() {
  return <Navigate to={routes.feed} replace />
}
