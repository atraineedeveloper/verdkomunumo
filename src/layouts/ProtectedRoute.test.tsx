import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'
import { routes } from '@/lib/routes'
import { useAuthStore } from '@/stores/auth'

function LocationProbe() {
  const location = useLocation()
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>
}

function renderProtectedRoute() {
  render(
    <MemoryRouter initialEntries={['/administrado?tab=roles#members']}>
      <Routes>
        <Route path={routes.login} element={<LocationProbe />} />
        <Route path={routes.feed} element={<LocationProbe />} />
        <Route
          path={routes.admin}
          element={(
            <ProtectedRoute minRole="admin">
              <div>admin panel</div>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      initialized: false,
      profileLoaded: false,
    })
  })

  it('redirects guests to login with a next param', () => {
    useAuthStore.setState({
      initialized: true,
      profileLoaded: true,
    })

    renderProtectedRoute()

    expect(screen.getByText('/ensaluti?next=%2Fadministrado%3Ftab%3Droles%23members')).toBeInTheDocument()
  })

  it('shows a spinner while admin permissions are still loading', () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as never,
      initialized: true,
      profileLoaded: false,
    })

    renderProtectedRoute()

    expect(screen.getByLabelText('Loading permissions')).toBeInTheDocument()
  })

  it('redirects users without the required role to the feed', () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as never,
      profile: { id: 'user-1', role: 'user', username: 'ada' } as never,
      initialized: true,
      profileLoaded: true,
    })

    renderProtectedRoute()

    expect(screen.getByText('/fonto')).toBeInTheDocument()
  })

  it('renders children when the role requirement is met', () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as never,
      profile: { id: 'user-1', role: 'admin', username: 'ada' } as never,
      initialized: true,
      profileLoaded: true,
    })

    renderProtectedRoute()

    expect(screen.getByText('admin panel')).toBeInTheDocument()
  })
})
