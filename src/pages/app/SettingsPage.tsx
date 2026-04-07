import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useToastStore } from '@/stores/toasts'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'
import i18n from '@/lib/i18n'
import { optimizeImageFiles, replaceInputFiles } from '@/lib/browser/images'
import { ESPERANTO_LEVELS } from '@/lib/constants'
import { EMAIL_NOTIFICATION_OPTIONS, isKnownNotificationType } from '@/lib/emailPreferences'
import { getAvatarUrl } from '@/lib/utils'
import type { EsperantoLevel, Profile, Theme } from '@/lib/types'
import { LocaleFlag } from '@/components/ui/LocaleFlag'

const themeValues: Theme[] = ['green', 'dark', 'vivid', 'minimal']
const themeKeys = ['theme_green', 'theme_dark', 'theme_vivid', 'theme_minimal'] as const
const locales = Object.keys(LOCALE_LABELS) as Locale[]

type SettingsForm = {
  username: string
  display_name: string
  bio: string
  esperanto_level: EsperantoLevel
  location: string
  website: string
  email_notifications_enabled: boolean
  email_notify_like: boolean
  email_notify_comment: boolean
  email_notify_follow: boolean
  email_notify_message: boolean
  email_notify_mention: boolean
  email_notify_category_approved: boolean
  email_notify_category_rejected: boolean
}

function formFromProfile(profile: Profile): SettingsForm {
  return {
    username: profile.username ?? '',
    display_name: profile.display_name ?? '',
    bio: profile.bio ?? '',
    esperanto_level: profile.esperanto_level ?? 'komencanto',
    location: profile.location ?? '',
    website: profile.website ?? '',
    email_notifications_enabled: profile.email_notifications_enabled ?? true,
    email_notify_like: profile.email_notify_like ?? true,
    email_notify_comment: profile.email_notify_comment ?? true,
    email_notify_follow: profile.email_notify_follow ?? true,
    email_notify_message: profile.email_notify_message ?? true,
    email_notify_mention: profile.email_notify_mention ?? true,
    email_notify_category_approved: profile.email_notify_category_approved ?? true,
    email_notify_category_rejected: profile.email_notify_category_rejected ?? true,
  }
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setTheme = useThemeStore((s) => s.setTheme)
  const toast = useToastStore()
  const locale = i18n.language as Locale
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const appliedEmailLinkRef = useRef<string | null>(null)
  const [form, setForm] = useState<SettingsForm>({
    username: profile?.username ?? '',
    display_name: profile?.display_name ?? '',
    bio: profile?.bio ?? '',
    esperanto_level: profile?.esperanto_level ?? 'komencanto',
    location: profile?.location ?? '',
    website: profile?.website ?? '',
    email_notifications_enabled: profile?.email_notifications_enabled ?? true,
    email_notify_like: profile?.email_notify_like ?? false,
    email_notify_comment: profile?.email_notify_comment ?? true,
    email_notify_follow: profile?.email_notify_follow ?? false,
    email_notify_message: profile?.email_notify_message ?? true,
    email_notify_mention: profile?.email_notify_mention ?? true,
    email_notify_category_approved: profile?.email_notify_category_approved ?? false,
    email_notify_category_rejected: profile?.email_notify_category_rejected ?? false,
  })

  const highlightedEmailType = isKnownNotificationType(searchParams.get('email')) ? searchParams.get('email') : null
  const emailLinkIntent = searchParams.get('unsubscribe') === '1'

  useEffect(() => {
    if (!profile) return
    setForm(formFromProfile(profile))
  }, [profile])

  useEffect(() => {
    if (!profile || !highlightedEmailType || !emailLinkIntent) return
    const option = EMAIL_NOTIFICATION_OPTIONS.find((entry) => entry.type === highlightedEmailType)
    if (!option) return

    const key = `${highlightedEmailType}:unsubscribe:${profile.id}`
    if (appliedEmailLinkRef.current === key) return

    appliedEmailLinkRef.current = key
    setForm((prev) => ({
      ...prev,
      [option.field]: false,
    }))
  }, [emailLinkIntent, highlightedEmailType, profile])

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user || !profile) throw new Error('Ne ensalutinta')
      const username = String(formData.get('username') ?? '')
      const { data: existingUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .maybeSingle()
      if (existingUsername) throw new Error('Tiu uzantnomo jam estas uzata')

      const avatar = formData.get('avatar')
      let avatarUrl: string | undefined
      if (avatar instanceof File && avatar.size > 0) {
        const ext = avatar.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/avatar-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatar, { upsert: true })
        if (uploadError) throw uploadError
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }

      function readCheckbox(name: keyof SettingsForm, fallback: boolean) {
        return formData.has(name) ? formData.get(name) === 'on' : fallback
      }

      const payload = {
        username,
        display_name: String(formData.get('display_name') ?? ''),
        bio: String(formData.get('bio') ?? ''),
        website: String(formData.get('website') ?? ''),
        location: String(formData.get('location') ?? ''),
        esperanto_level: String(formData.get('esperanto_level') ?? '') as EsperantoLevel,
        email_notifications_enabled: readCheckbox('email_notifications_enabled', profile.email_notifications_enabled ?? true),
        email_notify_like: readCheckbox('email_notify_like', profile.email_notify_like ?? true),
        email_notify_comment: readCheckbox('email_notify_comment', profile.email_notify_comment ?? true),
        email_notify_follow: readCheckbox('email_notify_follow', profile.email_notify_follow ?? true),
        email_notify_message: readCheckbox('email_notify_message', profile.email_notify_message ?? true),
        email_notify_mention: readCheckbox('email_notify_mention', profile.email_notify_mention ?? true),
        email_notify_category_approved: readCheckbox('email_notify_category_approved', profile.email_notify_category_approved ?? true),
        email_notify_category_rejected: readCheckbox('email_notify_category_rejected', profile.email_notify_category_rejected ?? true),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
      if (error) throw error
      return { ...profile, ...payload }
    },
    onSuccess: (nextProfile) => {
      setProfile(nextProfile)
      toast.success(t('toast_profile_saved'))
    },
    onError: (error: Error) => toast.error(error.message || t('toast_action_failed')),
  })

  const updateThemeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      if (!user) throw new Error('Ne ensalutinta')
      const { error } = await supabase.from('profiles').update({ theme }).eq('id', user.id)
      if (error) throw error
      return theme
    },
    onSuccess: (theme) => {
      setTheme(theme)
      toast.success(t('toast_theme_saved'))
    },
    onError: () => toast.error(t('toast_action_failed')),
  })

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file) return
    const [optimized] = await optimizeImageFiles([file], { maxDimension: 1200, quality: 0.84 })
    replaceInputFiles(input, optimized ? [optimized] : [])
    setAvatarPreview(URL.createObjectURL(optimized ?? file))
  }

  if (!profile) return null

  return (
    <>
      <Helmet><title>{t('settings_title')} — Verdkomunumo</title></Helmet>
      <h1 className="page-title">{t('settings_title')}</h1>

      <section className="section">
        <h2 className="section-title">{t('settings_profile')}</h2>
        <form onSubmit={(e) => {
          e.preventDefault()
          updateProfileMutation.mutate(new FormData(e.currentTarget))
        }}>
          <div className="avatar-field">
            <label className="avatar-wrap" htmlFor="avatar" title={t('settings_change_photo')}>
              <img className="avatar-preview" src={avatarPreview ?? getAvatarUrl(profile.avatar_url ?? '', profile.display_name ?? 'Verdkomunumo')} alt={profile.display_name ?? 'Avatar'} />
              <div className="avatar-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>{t('settings_change_photo')}</span>
              </div>
              <input id="avatar" name="avatar" type="file" accept="image/*" onChange={onAvatarChange} />
            </label>
            <div className="avatar-hint">
              <span className="avatar-name">{profile.display_name}</span>
              <span className="avatar-sub">@{profile.username}</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="username">Uzantnomo</label>
            <input id="username" name="username" type="text" minLength={3} maxLength={30} pattern="[a-z0-9_]+" required value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} />
          </div>

          <div className="field">
            <label htmlFor="display_name">{t('auth_display_name')}</label>
            <input id="display_name" name="display_name" type="text" required value={form.display_name} onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))} />
          </div>

          <div className="field">
            <label htmlFor="bio">{t('settings_bio')}</label>
            <textarea id="bio" name="bio" rows={3} maxLength={500} value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
          </div>

          <div className="field">
            <label htmlFor="esperanto_level">{t('settings_level')}</label>
            <select id="esperanto_level" name="esperanto_level" value={form.esperanto_level} onChange={(e) => setForm((prev) => ({ ...prev, esperanto_level: e.target.value as EsperantoLevel }))}>
              {Object.entries(ESPERANTO_LEVELS).map(([value, info]) => (
                <option key={value} value={value}>{info.emoji} {t(`level_${value}` as never)}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="location">{t('settings_location')}</label>
              <input id="location" name="location" type="text" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="website">{t('settings_website')}</label>
              <input id="website" name="website" type="url" placeholder="https://" value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} />
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? t('settings_saving') : t('settings_save')}
          </button>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">{t('settings_theme')}</h2>
        <div className="theme-grid">
          {themeValues.map((themeVal, i) => (
            <button key={themeVal} className={`theme-btn theme-${themeVal}`} type="button" onClick={() => updateThemeMutation.mutate(themeVal)}>
              {t(themeKeys[i])}
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="email-preferences">
        <h2 className="section-title">{t('settings_email', { defaultValue: 'Retpoŝtaj sciigoj' })}</h2>
        <p className="section-copy">{t('settings_email_help', { defaultValue: 'Administru kiajn retmesaĝojn Verdkomunumo sendu al vi.' })}</p>
        {emailLinkIntent && highlightedEmailType ? (
          <div className="section-note">
            {t('settings_email_link_notice', {
              defaultValue: 'Ni jam pretigis ĉi tiun preferon por vi. Konservu la ŝanĝojn por konfirmi la malabonon.',
            })}
          </div>
        ) : null}
        <form onSubmit={(e) => {
          e.preventDefault()
          const nextFormData = new FormData()
          nextFormData.set('username', form.username)
          nextFormData.set('display_name', form.display_name)
          nextFormData.set('bio', form.bio)
          nextFormData.set('website', form.website)
          nextFormData.set('location', form.location)
          nextFormData.set('esperanto_level', form.esperanto_level)
          if (form.email_notifications_enabled) nextFormData.set('email_notifications_enabled', 'on')
          if (form.email_notify_like) nextFormData.set('email_notify_like', 'on')
          if (form.email_notify_comment) nextFormData.set('email_notify_comment', 'on')
          if (form.email_notify_follow) nextFormData.set('email_notify_follow', 'on')
          if (form.email_notify_message) nextFormData.set('email_notify_message', 'on')
          if (form.email_notify_mention) nextFormData.set('email_notify_mention', 'on')
          if (form.email_notify_category_approved) nextFormData.set('email_notify_category_approved', 'on')
          if (form.email_notify_category_rejected) nextFormData.set('email_notify_category_rejected', 'on')
          updateProfileMutation.mutate(nextFormData)
        }}>
          <div className="toggle-list">
            <label className="toggle-row toggle-row-master">
              <div>
                <span className="toggle-kicker">{t('settings_email_master_kicker', { defaultValue: 'Tutmonde' })}</span>
                <span className="toggle-title">{t('settings_email_enabled', { defaultValue: 'Aktivigi ĉiujn retpoŝtajn sciigojn' })}</span>
                <span className="toggle-sub">{t('settings_email_enabled_hint', { defaultValue: 'Se vi malŝaltas ĉi tion, Verdkomunumo ne plu sendos al vi retmesaĝajn sciigojn.' })}</span>
              </div>
              <input
                name="email_notifications_enabled"
                type="checkbox"
                checked={form.email_notifications_enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, email_notifications_enabled: e.target.checked }))}
              />
            </label>

            {EMAIL_NOTIFICATION_OPTIONS.map((option) => (
              <label
                key={option.type}
                className={`toggle-row ${highlightedEmailType === option.type ? 'toggle-row-highlight' : ''} ${!form.email_notifications_enabled ? 'toggle-row-disabled' : ''}`}
              >
                <div>
                  {highlightedEmailType === option.type ? (
                    <span className="toggle-kicker">{t('settings_email_link_kicker', { defaultValue: 'Malabono el retmesaĝo' })}</span>
                  ) : null}
                  <span className="toggle-title">{t(option.titleKey as never, { defaultValue: option.defaultTitle })}</span>
                  <span className="toggle-sub">{t(option.hintKey as never, { defaultValue: option.defaultHint })}</span>
                </div>
                <input
                  name={option.field}
                  type="checkbox"
                  checked={form[option.field]}
                  disabled={!form.email_notifications_enabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, [option.field]: e.target.checked }))}
                />
              </label>
            ))}
          </div>

          <button className="btn-primary" type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? t('settings_saving') : t('settings_save')}
          </button>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">{t('settings_language')}</h2>
        <div className="theme-grid">
          {locales.map((l) => (
            <button key={l} className={`lang-btn-big ${locale === l ? 'active' : ''}`} type="button" onClick={() => i18n.changeLanguage(l)}>
              <LocaleFlag locale={l} className="lang-flag" />
              <span>{LOCALE_LABELS[l]}</span>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        .page-title { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 0 0 1.5rem; }
        .section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
        .section-title { font-size: 1rem; font-weight: 600; color: var(--color-text); margin: 0 0 1.25rem; }
        .section-copy { margin: -0.5rem 0 1rem; color: var(--color-text-muted); font-size: 0.88rem; line-height: 1.55; }
        .section-note { margin: -0.1rem 0 1rem; padding: 0.85rem 1rem; border-radius: 0.85rem; border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border)); background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)); color: var(--color-text); font-size: 0.87rem; line-height: 1.5; }
        .field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; flex: 1; }
        .avatar-field { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
        .avatar-wrap { position: relative; width: 80px; height: 80px; border-radius: 9999px; cursor: pointer; flex-shrink: 0; display: block; }
        .avatar-wrap input { display: none; }
        .avatar-preview { width: 80px; height: 80px; border-radius: 9999px; object-fit: cover; border: 2px solid var(--color-border); background: var(--color-surface-alt); display: block; transition: filter 0.15s; }
        .avatar-overlay { position: absolute; inset: 0; border-radius: 9999px; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: #fff; font-size: 0.65rem; font-weight: 600; opacity: 0; transition: opacity 0.15s; }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }
        .avatar-wrap:hover .avatar-preview { filter: brightness(0.75); }
        .avatar-hint { display: flex; flex-direction: column; gap: 2px; }
        .avatar-name { font-size: 0.95rem; font-weight: 600; color: var(--color-text); }
        .avatar-sub { font-size: 0.8rem; color: var(--color-text-muted); }
        .field-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        label { font-size: 0.875rem; font-weight: 500; color: var(--color-text); }
        input,textarea,select { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: 0.5rem; background: var(--color-bg); color: var(--color-text); font-size: 0.9rem; font-family: inherit; transition: border-color 0.15s; width: 100%; box-sizing: border-box; }
        input:focus,textarea:focus,select:focus { border-color: var(--color-primary); outline: none; }
        .btn-primary { padding: 0.5rem 1.25rem; background: var(--color-primary); color: white; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary:not(:disabled):hover { opacity: 0.9; }
        .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
        .theme-btn { padding: 0.75rem 1rem; border: 2px solid var(--color-border); border-radius: 0.75rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.15s, transform 0.1s; width: 100%; text-align: left; }
        .theme-btn:hover,.lang-btn-big:hover { transform: translateY(-1px); }
        .toggle-list { display: grid; gap: 0.9rem; margin-bottom: 1rem; }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.95rem 1rem; border: 1px solid var(--color-border); border-radius: 0.85rem; background: var(--color-bg); }
        .toggle-row-master { border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border)); background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg)); }
        .toggle-row-highlight { border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent); }
        .toggle-row-disabled { opacity: 0.7; }
        .toggle-kicker { display: inline-flex; margin-bottom: 0.35rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-primary); }
        .toggle-title { display: block; font-size: 0.92rem; font-weight: 600; color: var(--color-text); }
        .toggle-sub { display: block; margin-top: 0.2rem; font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.45; }
        .toggle-row input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--color-primary); flex-shrink: 0; }
        .toggle-row input[type="checkbox"]:disabled { cursor: not-allowed; opacity: 0.6; }
        .theme-green { background: #e8f5e9; color: #14532d; border-color: #1b7a4a; }
        .theme-dark { background: #1e293b; color: #4ade80; border-color: #22c55e; }
        .theme-vivid { background: #fdf4ff; color: #1e1b4b; border-color: #7c3aed; }
        .theme-minimal { background: #fafafa; color: #171717; border-color: #e5e5e5; }
        .lang-btn-big { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 2px solid var(--color-border); border-radius: 0.75rem; background: var(--color-bg); color: var(--color-text); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.15s, transform 0.1s; width: 100%; text-align: left; }
        .lang-btn-big.active { border-color: var(--color-primary); background: var(--color-primary); color: white; }
        .lang-flag { width: 28px; height: 21px; border-radius: 3px; display: block; box-shadow: 0 0 0 1px rgba(0,0,0,0.1); flex-shrink: 0; }
      `}</style>
    </>
  )
}
