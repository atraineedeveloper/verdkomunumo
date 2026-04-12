import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AppearanceSettingsSection } from '@/components/settings/AppearanceSettingsSection'
import { EmailPreferencesSection } from '@/components/settings/EmailPreferencesSection'
import { ProfileSettingsSection } from '@/components/settings/ProfileSettingsSection'
import { settingsStyles } from '@/components/settings/settingsStyles'
import { EMAIL_NOTIFICATION_OPTIONS, isKnownNotificationType } from '@/lib/emailPreferences'
import { type Locale } from '@/lib/i18n'
import i18n from '@/lib/i18n'
import { optimizeImageFiles, replaceInputFiles } from '@/lib/browser/images'
import { queryKeys } from '@/lib/query/keys'
import {
  buildEmailPreferencesPayload,
  buildProfilePayload,
  formFromProfile,
  type SettingsForm,
} from '@/lib/settingsProfile'
import { supabase } from '@/lib/supabase/client'
import type { Profile, Theme } from '@/lib/types'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useToastStore } from '@/stores/toasts'

export default function SettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setTheme = useThemeStore((state) => state.setTheme)
  const toast = useToastStore()
  const locale = i18n.language as Locale
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const appliedEmailLinkRef = useRef<string | null>(null)
  const [form, setForm] = useState<SettingsForm>(() => formFromProfile(profile ?? ({} as Profile)))

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
    setForm((current) => ({
      ...current,
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

      const payload = await buildProfilePayload(profile, formData, t, avatarUrl)
      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
      if (error) throw error
      return { ...profile, ...payload }
    },
    onSuccess: async (nextProfile) => {
      setProfile(nextProfile)
      await queryClient.invalidateQueries({ queryKey: queryKeys.mapUsers() })
      toast.success(t('toast_profile_saved'))
    },
    onError: (error: Error) => toast.error(error.message || t('toast_action_failed')),
  })

  const updateEmailPreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Ne ensalutinta')

      const payload = buildEmailPreferencesPayload(form)
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

  async function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    const [optimized] = await optimizeImageFiles([file], { maxDimension: 1200, quality: 0.84 })
    replaceInputFiles(input, optimized ? [optimized] : [])
    setAvatarPreview(URL.createObjectURL(optimized ?? file))
  }

  function onFormChange(updater: (current: SettingsForm) => SettingsForm) {
    setForm((current) => updater(current))
  }

  function onProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateProfileMutation.mutate(new FormData(event.currentTarget))
  }

  function onEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateEmailPreferencesMutation.mutate()
  }

  if (!profile) return null

  return (
    <>
      <Helmet>
        <title>{t('settings_title')} - Verdkomunumo</title>
      </Helmet>
      <h1 className="page-title">{t('settings_title')}</h1>

      <ProfileSettingsSection
        displayName={profile.display_name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        avatarPreview={avatarPreview}
        form={form}
        onAvatarChange={onAvatarChange}
        onFormChange={onFormChange}
        onSubmit={onProfileSubmit}
        isPending={updateProfileMutation.isPending}
        t={t}
      />

      <AppearanceSettingsSection
        locale={locale}
        onLocaleChange={(nextLocale) => { void i18n.changeLanguage(nextLocale) }}
        onThemeChange={(theme) => updateThemeMutation.mutate(theme)}
        themePending={updateThemeMutation.isPending}
        t={t}
      />

      <EmailPreferencesSection
        emailLinkIntent={emailLinkIntent}
        form={form}
        highlightedEmailType={highlightedEmailType}
        isPending={updateEmailPreferencesMutation.isPending}
        onFormChange={onFormChange}
        onSubmit={onEmailSubmit}
        t={t}
      />

      <style>{settingsStyles}</style>
    </>
  )
}
