import { describe, expect, it } from 'vitest'
import { feedWithFilter, routes } from './routes'

describe('routes', () => {
  it('uses Esperanto slugs with x-system transliteration', () => {
    expect(routes.landing).toBe('/')
    expect(routes.feed).toBe('/fonto')
    expect(routes.search).toBe('/sercxi')
    expect(routes.notifications).toBe('/sciigoj')
    expect(routes.messages).toBe('/mesagxoj')
    expect(routes.settings).toBe('/agordoj')
    expect(routes.login).toBe('/ensaluti')
    expect(routes.register).toBe('/registrigxi')
    expect(routes.authCallback).toBe('/auxtentigo/revoko')
    expect(routes.admin).toBe('/administrado')
    expect(routes.adminCategories).toBe('/administrado/kategorioj')
    expect(routes.adminReports).toBe('/administrado/raportoj')
  })

  it('builds dynamic resource routes', () => {
    expect(routes.profile('ana')).toBe('/profilo/ana')
    expect(routes.category('teknologio')).toBe('/kategorio/teknologio')
    expect(routes.post('123')).toBe('/afisxo/123')
    expect(routes.conversation('abc')).toBe('/mesagxoj/abc')
  })

  it('keeps following filter on the feed route', () => {
    expect(feedWithFilter()).toBe('/fonto')
    expect(feedWithFilter('all')).toBe('/fonto')
    expect(feedWithFilter('following')).toBe('/fonto?filter=following')
  })
})
