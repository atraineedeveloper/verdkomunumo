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
    <MemoryRouter initialEntries={['/agordoj']}>
      <Routes>
        <Route path={routes.login} element={<LocationProbe />} />
        <Route
          path={routes.settings}
          element={(
            <ProtectedRoute>
              <div>settings page</div>
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

    expect(screen.getByText('/ensaluti?next=%2Fagordoj')).toBeInTheDocument()
  })

  it('renders children for an authenticated user', () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as never,
      profile: { id: 'user-1', username: 'ada' } as never,
      initialized: true,
      profileLoaded: true,
    })

    renderProtectedRoute()

    expect(screen.getByText('settings page')).toBeInTheDocument()
  })
})
