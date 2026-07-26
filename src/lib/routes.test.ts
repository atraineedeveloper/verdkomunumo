import { describe, expect, it } from 'vitest'
import { routes } from './routes'

describe('routes', () => {
  it('uses the user map as the product home', () => {
    expect(routes.map).toBe('/')
    expect(routes.home).toBe('/')
    expect(routes.feed).toBe('/')
    expect(routes.samideanoj).toBe('/samideanoj')
    expect(routes.settings).toBe('/agordoj')
    expect(routes.login).toBe('/ensaluti')
    expect(routes.register).toBe('/registrigxi')
    expect(routes.forgotPassword).toBe('/forgesis-pasvorton')
    expect(routes.resetPassword).toBe('/restarigi-pasvorton')
    expect(routes.authCallback).toBe('/auxtentigo/revoko')
  })
})
