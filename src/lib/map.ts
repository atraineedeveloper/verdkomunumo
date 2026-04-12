import { supabase } from '@/lib/supabase/client'
import type { EsperantoLevel } from '@/lib/types'

export interface MapUser {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  esperanto_level: EsperantoLevel
  country: string
  region: string
  city: string
  location_lat: number
  location_lng: number
}

export async function fetchMapUsers(): Promise<MapUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, esperanto_level, country, region, city, location_lat, location_lng')
    .eq('map_visible', true)
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    username: row.username ?? '',
    display_name: row.display_name ?? '',
    avatar_url: row.avatar_url ?? null,
    esperanto_level: (row.esperanto_level ?? 'komencanto') as EsperantoLevel,
    country: row.country ?? '',
    region: row.region ?? '',
    city: row.city ?? '',
    location_lat: row.location_lat as number,
    location_lng: row.location_lng as number,
  }))
}
