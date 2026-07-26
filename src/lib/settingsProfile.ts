import type { TFunction } from 'i18next'
import type { EsperantoLevel, Profile } from '@/lib/types'

export type SettingsForm = {
  username: string
  display_name: string
  bio: string
  esperanto_level: EsperantoLevel
  country: string
  region: string
  city: string
  map_visible: boolean
  website: string
}

export type GeocodeResult = {
  lat: number
  lng: number
}

export type GeocodeFn = (query: string) => Promise<GeocodeResult | null>

export function formFromProfile(profile: Profile): SettingsForm {
  return {
    username: profile.username ?? '',
    display_name: profile.display_name ?? '',
    bio: profile.bio ?? '',
    esperanto_level: profile.esperanto_level ?? 'komencanto',
    country: profile.country ?? '',
    region: profile.region ?? '',
    city: profile.city ?? '',
    map_visible: profile.map_visible ?? false,
    website: profile.website ?? '',
  }
}

export async function geocodeRegion(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({ q: query, format: 'json', limit: '1' })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)

  if (!res.ok) {
    throw new Error(`Geocoding failed with status ${res.status}`)
  }

  const data: Array<{ lat: string; lon: string }> = await res.json()
  if (!data.length) return null

  return {
    lat: Number.parseFloat(data[0].lat),
    lng: Number.parseFloat(data[0].lon),
  }
}

export async function resolveLocationFields(
  profile: Profile,
  formData: FormData,
  t: TFunction,
  geocode: GeocodeFn = geocodeRegion,
) {
  const country = String(formData.get('country') ?? '').trim()
  const region = String(formData.get('region') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const mapVisible = formData.get('map_visible') === 'on'
  if (!mapVisible) {
    return {
      country,
      region,
      city,
      map_visible: false,
      location_lat: null,
      location_lng: null,
    }
  }

  const locationQuery = [city, region, country].filter(Boolean).join(', ')
  if (!locationQuery) {
    throw new Error(
      t('settings_map_location_required', {
        defaultValue: 'Choose at least a country, region or city before enabling the public map.',
      }),
    )
  }

  const locationChanged =
    country !== (profile.country ?? '') ||
    region !== (profile.region ?? '') ||
    city !== (profile.city ?? '')

  const needsGeocode =
    locationChanged ||
    !profile.map_visible ||
    profile.location_lat == null ||
    profile.location_lng == null

  const geocoded = needsGeocode
    ? await geocode(locationQuery)
    : { lat: profile.location_lat, lng: profile.location_lng }

  if (!geocoded) {
    throw new Error(
      t('settings_map_geocode_failed', {
        defaultValue: 'We could not locate that region. Adjust the location and try again.',
      }),
    )
  }

  return {
    country,
    region,
    city,
    map_visible: true,
    location_lat: geocoded.lat,
    location_lng: geocoded.lng,
  }
}

export async function buildProfilePayload(
  profile: Profile,
  formData: FormData,
  t: TFunction,
  avatarUrl?: string,
  geocode: GeocodeFn = geocodeRegion,
) {
  const locationFields = await resolveLocationFields(profile, formData, t, geocode)

  return {
    username: String(formData.get('username') ?? '').trim(),
    display_name: String(formData.get('display_name') ?? '').trim(),
    bio: String(formData.get('bio') ?? '').trim(),
    website: String(formData.get('website') ?? '').trim(),
    esperanto_level: String(formData.get('esperanto_level') ?? '') as EsperantoLevel,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    ...locationFields,
    updated_at: new Date().toISOString(),
  }
}
