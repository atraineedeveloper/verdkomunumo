import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { TimelineSkeleton } from '@/components/ui/TimelineSkeleton'
import { LEVEL_COLORS } from '@/lib/icons'
import { fetchMapUsers, type MapUser } from '@/lib/map'
import { queryKeys } from '@/lib/query/keys'
import { routes } from '@/lib/routes'
import type { EsperantoLevel } from '@/lib/types'
import { getAvatarUrl } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" fill="none">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill="#22c55e" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#ffffff"/>
  </svg>`,
)

const markerIcon = new Icon({
  iconUrl: `data:image/svg+xml,${PIN_SVG}`,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -44],
})

function groupByLocation(users: MapUser[]): Map<string, MapUser[]> {
  const groups = new Map<string, MapUser[]>()

  for (const user of users) {
    const key = `${user.location_lat.toFixed(2)},${user.location_lng.toFixed(2)}`
    const existing = groups.get(key) ?? []
    groups.set(key, [...existing, user])
  }

  return groups
}

function UserCard({ user }: { user: MapUser }) {
  const levelColor = LEVEL_COLORS[user.esperanto_level as EsperantoLevel] ?? 'var(--color-primary)'

  return (
    <Link to={routes.profile(user.username)} className="map-user-card">
      <img
        src={getAvatarUrl(user.avatar_url ?? '', user.display_name)}
        alt={user.display_name}
        className="map-user-avatar"
      />
      <div className="map-user-info">
        <span className="map-user-name">{user.display_name}</span>
        <span className="map-user-username">@{user.username}</span>
        <span className="map-user-level" style={{ color: levelColor }}>
          {user.esperanto_level}
        </span>
        <span className="map-user-location">
          {[user.city, user.region, user.country].filter(Boolean).join(', ')}
        </span>
      </div>
    </Link>
  )
}

export default function SamideanojPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const isLoggedIn = user !== null
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.mapUsers(),
    queryFn: fetchMapUsers,
    staleTime: 5 * 60 * 1000,
    enabled: isLoggedIn,
  })

  const locationGroups = useMemo(() => groupByLocation(users), [users])
  const selectedUsers = selectedKey ? (locationGroups.get(selectedKey) ?? []) : []
  const totalCount = users.length

  if (isLoggedIn && isLoading) return <TimelineSkeleton items={3} />

  if (isLoggedIn && isError) {
    return (
      <div className="map-error">
        <p>{t('toast_action_failed')}</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{t('map_title', { defaultValue: 'Samideanoj Proksime' })} - Verdkomunumo</title>
        <meta
          name="description"
          content={t('map_meta_desc', {
            defaultValue: 'Find nearby Esperantists who chose to appear on the public map.',
          })}
        />
      </Helmet>

      <div className="map-page">
        <header className="map-header">
          <h1 className="map-heading">{t('map_title', { defaultValue: 'Samideanoj Proksime' })}</h1>
          <p className="map-sub">
            {!isLoggedIn
              ? t('map_guest_hint', {
                  defaultValue: 'Sign in to explore nearby Esperantists who opted into the map.',
                })
              : totalCount > 0
                ? t('map_count', { count: totalCount, defaultValue: '{{count}} users are sharing their location' })
                : t('map_empty', { defaultValue: 'No users have enabled the map yet.' })}
          </p>
        </header>

        <div className="map-layout">
          <div className="map-container-wrap">
            {!isLoggedIn ? (
              <div className="map-empty-state">
                <span className="map-empty-icon">Map</span>
                <p>
                  {t('map_guest_cta', {
                    defaultValue: 'Log in to browse nearby members and contact people who share their location.',
                  })}
                </p>
                <Link to={routes.login} className="map-settings-link">
                  {t('nav_login')}
                </Link>
              </div>
            ) : totalCount === 0 ? (
              <div className="map-empty-state">
                <span className="map-empty-icon">Map</span>
                <p>
                  {t('map_empty_hint', {
                    defaultValue: 'Enable "Show me on the map" in settings to appear here.',
                  })}
                </p>
                <Link to={routes.settings} className="map-settings-link">
                  {t('nav_settings')}
                </Link>
              </div>
            ) : (
              <MapContainer center={[20, 0]} zoom={2} className="leaflet-map" scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {Array.from(locationGroups.entries()).map(([key, group]) => {
                  const [lat, lng] = key.split(',').map(Number)

                  return (
                    <Marker
                      key={key}
                      position={[lat, lng]}
                      icon={markerIcon}
                      eventHandlers={{ click: () => setSelectedKey(key) }}
                    >
                      <Popup>
                        <div className="map-popup">
                          <strong className="map-popup-title">
                            {group[0].city || group[0].region || group[0].country}
                          </strong>
                          <span className="map-popup-count">
                            {group.length} {t('map_popup_users', { defaultValue: 'users' })}
                          </span>
                          <button
                            type="button"
                            className="map-popup-btn"
                            onClick={() => setSelectedKey(key)}
                          >
                            {t('map_popup_view', { defaultValue: 'View list' })}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            )}
          </div>

          {selectedKey && selectedUsers.length > 0 && isLoggedIn && (
            <aside className="map-sidebar">
              <div className="map-sidebar-header">
                <span className="map-sidebar-title">
                  {selectedUsers[0].city || selectedUsers[0].region || selectedUsers[0].country}
                </span>
                <button
                  type="button"
                  className="map-sidebar-close"
                  aria-label={t('suggestion_cancel')}
                  onClick={() => setSelectedKey(null)}
                >
                  x
                </button>
              </div>
              <div className="map-sidebar-list">
                {selectedUsers.map((selectedUser) => (
                  <UserCard key={selectedUser.id} user={selectedUser} />
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>

      <style>{`
        .map-page { display: flex; flex-direction: column; height: 100%; }
        .map-header { margin-bottom: 1rem; }
        .map-heading { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.25rem; }
        .map-sub { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
        .map-layout { display: flex; gap: 1rem; align-items: flex-start; }
        .map-container-wrap { flex: 1; border-radius: 1rem; overflow: hidden; border: 1px solid var(--color-border); min-height: 480px; background: var(--color-surface); }
        .leaflet-map { width: 100%; height: 480px; }
        .map-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; height: 480px; color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: 2rem; }
        .map-empty-icon { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
        .map-settings-link { color: var(--color-primary); text-decoration: none; font-weight: 600; }
        .map-settings-link:hover { text-decoration: underline; }
        .map-error { display: flex; justify-content: center; padding: 2rem; color: var(--color-text-muted); font-size: 0.9rem; }
        .map-sidebar { width: 280px; flex-shrink: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; overflow: hidden; }
        .map-sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1rem; border-bottom: 1px solid var(--color-border); }
        .map-sidebar-title { font-size: 0.95rem; font-weight: 600; color: var(--color-text); }
        .map-sidebar-close { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 0.9rem; padding: 0.2rem; transition: color 0.15s; text-transform: uppercase; }
        .map-sidebar-close:hover { color: var(--color-text); }
        .map-sidebar-list { display: flex; flex-direction: column; gap: 0; max-height: 420px; overflow-y: auto; }
        .map-user-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; text-decoration: none; border-bottom: 1px solid var(--color-border); transition: background 0.12s; }
        .map-user-card:last-child { border-bottom: none; }
        .map-user-card:hover { background: var(--color-bg); }
        .map-user-avatar { width: 40px; height: 40px; border-radius: 9999px; object-fit: cover; border: 2px solid var(--color-border); flex-shrink: 0; }
        .map-user-info { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
        .map-user-name { font-size: 0.875rem; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .map-user-username { font-size: 0.78rem; color: var(--color-text-muted); }
        .map-user-level { font-size: 0.75rem; font-weight: 500; }
        .map-user-location { font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .map-popup { display: flex; flex-direction: column; gap: 0.35rem; min-width: 120px; }
        .map-popup-title { font-size: 0.875rem; font-weight: 700; color: #111; }
        .map-popup-count { font-size: 0.8rem; color: #555; }
        .map-popup-btn { display: inline-block; margin-top: 0.25rem; padding: 0.3rem 0.75rem; background: #22c55e; color: white; border: none; border-radius: 0.4rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; text-decoration: none; text-align: center; }
        .map-popup-btn:hover { opacity: 0.85; }

        @media (max-width: 700px) {
          .map-layout { flex-direction: column; }
          .map-sidebar { width: 100%; }
          .map-sidebar-list { max-height: 260px; }
        }
      `}</style>
    </>
  )
}
