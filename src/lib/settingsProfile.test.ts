import { describe, expect, it, vi } from 'vitest'
import { buildEmailPreferencesPayload, formFromProfile, resolveLocationFields, type SettingsForm } from './settingsProfile'
import type { Profile } from './types'

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    username: 'ada',
    display_name: 'Ada',
    bio: '',
    avatar_url: '',
    esperanto_level: 'komencanto',
    theme: 'green',
    role: 'user',
    website: '',
    location: '',
    country: null,
    region: null,
    city: null,
    location_lat: null,
    location_lng: null,
    map_visible: false,
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    email_notifications_enabled: true,
    email_notify_like: true,
    email_notify_comment: true,
    email_notify_follow: true,
    email_notify_message: true,
    email_notify_mention: true,
    email_notify_category_approved: true,
    email_notify_category_rejected: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function buildFormData(values: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value)
  }
  return formData
}

describe('settingsProfile helpers', () => {
  it('maps a profile into editable form state', () => {
    const profile = buildProfile({ country: 'Mexico', city: 'Monterrey', map_visible: true })

    expect(formFromProfile(profile)).toMatchObject({
      username: 'ada',
      country: 'Mexico',
      city: 'Monterrey',
      map_visible: true,
    })
  })

  it('clears stored coordinates when the public map is disabled', async () => {
    const profile = buildProfile({
      country: 'Mexico',
      region: 'Nuevo Leon',
      city: 'Monterrey',
      location_lat: 25.68,
      location_lng: -100.31,
      map_visible: true,
    })

    const result = await resolveLocationFields(
      profile,
      buildFormData({ country: 'Mexico', region: 'Nuevo Leon', city: 'Monterrey' }),
      ((key: string) => key) as never,
    )

    expect(result).toEqual({
      country: 'Mexico',
      region: 'Nuevo Leon',
      city: 'Monterrey',
      map_visible: false,
      location_lat: null,
      location_lng: null,
    })
  })

  it('requires location input before enabling the public map', async () => {
    const profile = buildProfile()
    const t = vi.fn().mockReturnValue('location required')

    await expect(
      resolveLocationFields(
        profile,
        buildFormData({ map_visible: 'on' }),
        t as never,
      ),
    ).rejects.toThrow('location required')
  })

  it('re-geocodes when map visibility is enabled with a new location', async () => {
    const profile = buildProfile({ map_visible: false })
    const geocode = vi.fn().mockResolvedValue({ lat: 25.67, lng: -100.30 })

    const result = await resolveLocationFields(
      profile,
      buildFormData({
        country: 'Mexico',
        region: 'Nuevo Leon',
        city: 'Monterrey',
        map_visible: 'on',
      }),
      ((key: string) => key) as never,
      geocode,
    )

    expect(geocode).toHaveBeenCalledWith('Monterrey, Nuevo Leon, Mexico')
    expect(result.location_lat).toBe(25.67)
    expect(result.location_lng).toBe(-100.3)
  })

  it('fails when geocoding does not find the selected region', async () => {
    const profile = buildProfile()
    const geocode = vi.fn().mockResolvedValue(null)
    const t = vi.fn().mockReturnValue('geocode failed')

    await expect(
      resolveLocationFields(
        profile,
        buildFormData({
          country: 'Mexico',
          city: 'Monterrey',
          map_visible: 'on',
        }),
        t as never,
        geocode,
      ),
    ).rejects.toThrow('geocode failed')
  })

  it('builds email settings without touching location fields', () => {
    const form = {
      ...formFromProfile(buildProfile()),
      email_notifications_enabled: false,
      email_notify_message: false,
    } satisfies SettingsForm

    expect(buildEmailPreferencesPayload(form)).toMatchObject({
      email_notifications_enabled: false,
      email_notify_message: false,
    })
    expect(buildEmailPreferencesPayload(form)).not.toHaveProperty('country')
    expect(buildEmailPreferencesPayload(form)).not.toHaveProperty('location_lat')
  })
})
