import type { TFunction } from 'i18next'
import type { EsperantoLevel, Profile, SocialLink } from '@/lib/types'
import { contactEmailSchema, socialLinksSchema } from '@/lib/validators'
import { SOCIAL_PLATFORM_META } from '@/lib/constants'

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
  contact_email: string
  social_links: SocialLink[]
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
    contact_email: profile.contact_email ?? '',
    social_links: profile.social_links ?? [],
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

export function resolveSocialLinks(formData: FormData, t: TFunction): SocialLink[] {
  const platforms = formData.getAll('social_platform').map((value) => String(value))
  const urls = formData.getAll('social_url').map((value) => String(value).trim())

  const links = platforms
    .map((platform, index) => ({ platform: platform as SocialLink['platform'], url: urls[index] ?? '' }))
    .filter((link) => link.url !== '')

  const result = socialLinksSchema.safeParse(links)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const index = typeof firstIssue?.path[0] === 'number' ? firstIssue.path[0] : 0
    const invalidLink = links[index]
    throw new Error(
      t('settings_social_link_invalid_at', {
        position: index + 1,
        platform: invalidLink ? SOCIAL_PLATFORM_META[invalidLink.platform].label : '',
        defaultValue: 'Social link {{position}} ({{platform}}) is not a valid URL.',
      }),
    )
  }

  return result.data as SocialLink[]
}

export function resolveContactEmail(formData: FormData, t: TFunction): string {
  const contactEmail = String(formData.get('contact_email') ?? '').trim()

  const result = contactEmailSchema.safeParse(contactEmail)
  if (!result.success) {
    throw new Error(
      t('settings_contact_email_invalid', { defaultValue: 'Enter a valid contact email or leave it blank.' }),
    )
  }

  return contactEmail
}

export async function buildProfilePayload(
  profile: Profile,
  formData: FormData,
  t: TFunction,
  avatarUrl?: string,
  geocode: GeocodeFn = geocodeRegion,
) {
  const locationFields = await resolveLocationFields(profile, formData, t, geocode)
  const contactEmail = resolveContactEmail(formData, t)
  const socialLinks = resolveSocialLinks(formData, t)

  return {
    username: String(formData.get('username') ?? '').trim(),
    display_name: String(formData.get('display_name') ?? '').trim(),
    bio: String(formData.get('bio') ?? '').trim(),
    website: String(formData.get('website') ?? '').trim(),
    contact_email: contactEmail === '' ? null : contactEmail,
    social_links: socialLinks,
    esperanto_level: String(formData.get('esperanto_level') ?? '') as EsperantoLevel,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    ...locationFields,
    updated_at: new Date().toISOString(),
  }
}
