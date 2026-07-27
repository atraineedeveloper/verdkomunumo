import { useEffect, useState } from 'react'
import i18n from '@/lib/i18n'
import {
  countryNameToIso,
  getAllCountries,
  getCitiesOfState,
  getStatesOfCountry,
  stateNameToIso,
} from '@/lib/countries'
import { ESPERANTO_LEVELS } from '@/lib/constants'
import { getAvatarUrl } from '@/lib/utils'
import type { SettingsForm } from '@/lib/settingsProfile'
import { SocialLinksEditor } from './SocialLinksEditor'

interface ProfileSettingsSectionProps {
  displayName: string
  username: string
  avatarUrl: string | null | undefined
  avatarPreview: string | null
  form: SettingsForm
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onFormChange: (updater: (current: SettingsForm) => SettingsForm) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

export function ProfileSettingsSection({
  displayName,
  username,
  avatarUrl,
  avatarPreview,
  form,
  onAvatarChange,
  onFormChange,
  onSubmit,
  isPending,
  t,
}: ProfileSettingsSectionProps) {
  const [countries, setCountries] = useState<Array<{ label: string; value: string }>>([])
  const [states, setStates] = useState<Array<{ label: string; value: string; isoCode: string }>>([])
  const [cities, setCities] = useState<Array<{ label: string; value: string }>>([])

  useEffect(() => {
    let cancelled = false

    void getAllCountries(i18n.language).then((nextCountries) => {
      if (!cancelled) setCountries(nextCountries)
    })

    return () => {
      cancelled = true
    }
  }, [i18n.language])

  useEffect(() => {
    let cancelled = false

    if (!form.country) {
      setStates([])
      setCities([])
      return
    }

    void countryNameToIso(form.country)
      .then((countryIso) => (countryIso ? getStatesOfCountry(countryIso) : []))
      .then((nextStates) => {
        if (!cancelled) setStates(nextStates)
      })

    return () => {
      cancelled = true
    }
  }, [form.country])

  useEffect(() => {
    let cancelled = false

    if (!form.country || !form.region) {
      setCities([])
      return
    }

    void countryNameToIso(form.country)
      .then(async (countryIso) => {
        if (!countryIso) return []
        const stateIso = await stateNameToIso(countryIso, form.region)
        return stateIso ? getCitiesOfState(countryIso, stateIso) : []
      })
      .then((nextCities) => {
        if (!cancelled) setCities(nextCities)
      })

    return () => {
      cancelled = true
    }
  }, [form.country, form.region])

  return (
    <section className="section">
      <h2 className="section-title">{t('settings_profile')}</h2>
      <form onSubmit={onSubmit}>
        <div className="avatar-field">
          <label className="avatar-wrap" htmlFor="avatar" title={t('settings_change_photo')}>
            <img
              className="avatar-preview"
              src={avatarPreview ?? getAvatarUrl(avatarUrl ?? '', displayName ?? 'Verdkomunumo')}
              alt={displayName ?? 'Avatar'}
            />
            <div className="avatar-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>{t('settings_change_photo')}</span>
            </div>
            <input id="avatar" name="avatar" type="file" accept="image/*" onChange={onAvatarChange} />
          </label>
          <div className="avatar-hint">
            <span className="avatar-name">{displayName}</span>
            <span className="avatar-sub">@{username}</span>
          </div>
        </div>

        <h3 className="subsection-title">{t('settings_section_identity')}</h3>

        <div className="field">
          <label htmlFor="username">Uzantnomo</label>
          <input
            id="username"
            name="username"
            type="text"
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_]+"
            required
            value={form.username}
            onChange={(event) => onFormChange((current) => ({ ...current, username: event.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="display_name">{t('auth_display_name')}</label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            value={form.display_name}
            onChange={(event) => onFormChange((current) => ({ ...current, display_name: event.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="bio">{t('settings_bio')}</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={500}
            value={form.bio}
            onChange={(event) => onFormChange((current) => ({ ...current, bio: event.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="esperanto_level">{t('settings_level')}</label>
          <select
            id="esperanto_level"
            name="esperanto_level"
            value={form.esperanto_level}
            onChange={(event) => onFormChange((current) => ({ ...current, esperanto_level: event.target.value as SettingsForm['esperanto_level'] }))}
          >
            {Object.entries(ESPERANTO_LEVELS).map(([value, info]) => (
              <option key={value} value={value}>{info.emoji} {t(`level_${value}`)}</option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="sex">{t('settings_sex')}</label>
            <select
              id="sex"
              name="sex"
              value={form.sex}
              onChange={(event) => onFormChange((current) => ({ ...current, sex: event.target.value as SettingsForm['sex'] }))}
            >
              <option value="">-</option>
              <option value="male">{t('settings_sex_male')}</option>
              <option value="female">{t('settings_sex_female')}</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="birth_date">{t('settings_birth_date')}</label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              value={form.birth_date}
              onChange={(event) => onFormChange((current) => ({ ...current, birth_date: event.target.value }))}
            />
          </div>
        </div>
        <span className="field-hint">{t('settings_private_fields_hint')}</span>

        <h3 className="subsection-title">{t('settings_section_location')}</h3>

        <div className="field-row">
          <div className="field">
            <label htmlFor="country">{t('settings_country')}</label>
            <select
              id="country"
              name="country"
              value={form.country}
              onChange={(event) => onFormChange((current) => ({
                ...current,
                country: event.target.value,
                region: '',
                city: '',
              }))}
            >
              <option value="">-</option>
              {countries.map((country) => (
                <option key={country.value} value={country.value}>{country.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="region">{t('settings_region')}</label>
            {states.length > 0 ? (
              <select
                id="region"
                name="region"
                value={form.region}
                onChange={(event) => onFormChange((current) => ({
                  ...current,
                  region: event.target.value,
                  city: '',
                }))}
              >
                <option value="">-</option>
                {states.map((state) => (
                  <option key={state.isoCode} value={state.value}>{state.label}</option>
                ))}
              </select>
            ) : (
              <input
                id="region"
                name="region"
                type="text"
                value={form.region}
                onChange={(event) => onFormChange((current) => ({ ...current, region: event.target.value, city: '' }))}
                placeholder={t('settings_region')}
              />
            )}
          </div>

          <div className="field">
            <label htmlFor="city">{t('settings_city')}</label>
            {cities.length > 0 ? (
              <select
                id="city"
                name="city"
                value={form.city}
                onChange={(event) => onFormChange((current) => ({ ...current, city: event.target.value }))}
              >
                <option value="">-</option>
                {cities.map((city) => (
                  <option key={city.value} value={city.value}>{city.label}</option>
                ))}
              </select>
            ) : (
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={(event) => onFormChange((current) => ({ ...current, city: event.target.value }))}
                placeholder={t('settings_city')}
              />
            )}
          </div>
        </div>

        <div className="field">
          <label className="toggle-row" style={{ marginTop: '0.5rem', marginBottom: '0' }}>
            <div>
              <span className="toggle-title">{t('settings_map_visible')}</span>
              <span className="toggle-sub">{t('settings_map_visible_hint')}</span>
            </div>
            <input
              type="checkbox"
              name="map_visible"
              checked={form.map_visible}
              onChange={(event) => onFormChange((current) => ({ ...current, map_visible: event.target.checked }))}
            />
          </label>
        </div>

        <h3 className="subsection-title">{t('settings_section_contact')}</h3>

        <div className="field">
          <label htmlFor="website">{t('settings_website')}</label>
          <input
            id="website"
            name="website"
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(event) => onFormChange((current) => ({ ...current, website: event.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="contact_email">{t('settings_contact_email')}</label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="you@example.com"
            value={form.contact_email}
            onChange={(event) => onFormChange((current) => ({ ...current, contact_email: event.target.value }))}
          />
          <span className="field-hint">{t('settings_contact_email_hint')}</span>
        </div>

        <SocialLinksEditor
          links={form.social_links}
          onChange={(updater) => onFormChange((current) => ({ ...current, social_links: updater(current.social_links) }))}
          t={t}
        />

        <button className="btn-primary" type="submit" disabled={isPending}>
          {isPending ? t('settings_saving') : t('settings_save')}
        </button>
      </form>
    </section>
  )
}
