import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, MessageCircle, Palette, Settings, LogOut, Search, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase/client'
import { LOCALE_LABELS, LOCALE_COUNTRY, type Locale } from '@/lib/i18n'
import { APP_NAME } from '@/lib/constants'
import type { Theme } from '@/lib/types'
import i18n from '@/lib/i18n'
import { routes } from '@/lib/routes'
import { hasRequiredRole } from '@/lib/utils'

const THEMES: Theme[] = ['green', 'dark', 'vivid', 'minimal']
const LOCALES = Object.keys(LOCALE_LABELS) as Locale[]

interface NavbarProps {
  unreadNotificationsCount?: number
  unreadMessagesCount?: number
}

export function Navbar({ unreadNotificationsCount = 0, unreadMessagesCount = 0 }: NavbarProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useThemeStore()
  const profile = useAuthStore((s) => s.profile)
  const clearAuth = useAuthStore((s) => s.clear)
  const navigate = useNavigate()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const locale = i18n.language as Locale
  const canAccessAdmin = profile ? hasRequiredRole(profile.role, 'moderator') : false

  function cycleTheme() {
    const idx = THEMES.indexOf(theme)
    setTheme(THEMES[(idx + 1) % THEMES.length])
  }

  function selectLocale(l: Locale) {
    i18n.changeLanguage(l)
    setShowLangMenu(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    clearAuth()
    navigate(routes.login)
  }

  return (
    <nav className="sticky top-0 z-[100] bg-[var(--color-bg)] border-b border-[var(--color-border)]">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 h-[52px] flex items-center gap-2 sm:gap-4">

        {/* Logo */}
        <Link to={routes.feed} className="flex items-center gap-1.5 no-underline flex-shrink-0">
          <span className="text-[1.3rem] leading-none text-[var(--color-primary)]">★</span>
          <span className="hidden sm:block text-[0.95rem] font-bold tracking-tight text-[var(--color-text)]">
            {APP_NAME}
          </span>
          <span className="text-[0.6rem] font-bold tracking-wider uppercase text-[var(--color-primary)] bg-[var(--color-primary-dim)] border border-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] px-1.5 py-0.5 rounded-full self-start mt-0.5">
            beta
          </span>
        </Link>

        {/* Search */}
        <Link
          to={routes.search}
          className="hidden sm:flex flex-1 max-w-[260px] items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-[6px] text-[var(--color-text-muted)] text-[0.8rem] no-underline hover:border-[var(--color-primary)] transition-colors"
        >
          <Search size={13} strokeWidth={2} />
          <span>{t('nav_search')}…</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 ml-auto">

          {/* Lang picker */}
          <div className="relative">
            <button
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
              title={t('nav_change_lang')}
              onClick={() => { setShowLangMenu(!showLangMenu); setShowUserMenu(false) }}
            >
              {LOCALE_COUNTRY[locale]
                ? <span className={`fi fi-${LOCALE_COUNTRY[locale]} block w-5 h-[15px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)]`} />
                : <span className="inline-flex items-center justify-center w-5 h-[15px] rounded-[2px] bg-[#16a34a] text-white text-[0.58rem] font-bold">EO</span>
              }
            </button>
            {showLangMenu && (
              <>
                <button className="fixed inset-0 z-[90] bg-transparent border-0 cursor-default p-0" onClick={() => setShowLangMenu(false)} tabIndex={-1} aria-hidden />
                <div className="absolute top-[calc(100%+8px)] right-0 z-[100] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[10px] min-w-[168px] p-1.5 shadow-lg animate-[pop_0.12s_ease]">
                  {LOCALES.map((l) => (
                    <button
                      key={l}
                      onClick={() => selectLocale(l)}
                      className={`flex items-center gap-2 w-full px-2.5 py-[0.42rem] border-0 text-left text-[0.825rem] font-[inherit] cursor-pointer rounded-[6px] transition-all no-underline ${locale === l ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'}`}
                    >
                      {LOCALE_COUNTRY[l]
                        ? <span className={`fi fi-${LOCALE_COUNTRY[l]} block w-5 h-[15px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)] flex-shrink-0`} />
                        : <span className="inline-flex items-center justify-center w-5 h-[15px] rounded-[2px] bg-[#16a34a] text-white text-[0.58rem] font-bold flex-shrink-0">EO</span>
                      }
                      <span>{LOCALE_LABELS[l]}</span>
                      {locale === l && <span className="ml-auto text-[0.75rem]">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme cycle */}
          <button
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
            title={t('nav_change_theme')}
            onClick={cycleTheme}
          >
            <Palette size={16} strokeWidth={1.75} />
          </button>

          {/* Notifications */}
          <Link
            to={routes.notifications}
            title={t('nav_notifications')}
            className="relative flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent text-[var(--color-text-muted)] no-underline hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
          >
            <Bell size={16} strokeWidth={1.75} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 bg-[var(--color-danger)] text-white text-[0.58rem] font-bold min-w-[14px] h-[14px] px-[3px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-bg)]">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            to={routes.messages}
            title={t('nav_messages')}
            className="relative flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent text-[var(--color-text-muted)] no-underline hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
          >
            <MessageCircle size={16} strokeWidth={1.75} />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-1 bg-[var(--color-danger)] text-white text-[0.58rem] font-bold min-w-[14px] h-[14px] px-[3px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-bg)]">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </Link>

          {/* Avatar / user menu */}
          {profile && (
            <div className="relative">
              <button
                className="p-0 border-0 bg-transparent cursor-pointer rounded-full flex"
                onClick={() => { setShowUserMenu(!showUserMenu); setShowLangMenu(false) }}
              >
                <img
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=16a34a&color=fff`}
                  alt={profile.display_name}
                  className="w-[30px] h-[30px] rounded-full object-cover border-[1.5px] border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                />
              </button>
              {showUserMenu && (
                <>
                  <button className="fixed inset-0 z-[90] bg-transparent border-0 cursor-default p-0" onClick={() => setShowUserMenu(false)} tabIndex={-1} aria-hidden />
                  <div className="absolute top-[calc(100%+8px)] right-0 z-[100] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[10px] min-w-[168px] p-1.5 shadow-lg animate-[pop_0.12s_ease]">
                    <div className="px-2.5 py-2 pb-1.5 flex flex-col gap-px">
                      <span className="text-[0.825rem] font-semibold text-[var(--color-text)]">{profile.display_name}</span>
                      <span className="text-[0.75rem] text-[var(--color-text-muted)]">@{profile.username}</span>
                    </div>
                    <div className="h-px bg-[var(--color-border)] my-1.5" />
                    <Link to={routes.profile(profile.username)} onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 w-full px-2.5 py-[0.42rem] text-[var(--color-text-muted)] text-[0.825rem] no-underline rounded-[6px] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all">
                      <User size={13} strokeWidth={1.75} /> {t('nav_profile')}
                    </Link>
                    <Link to={routes.settings} onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 w-full px-2.5 py-[0.42rem] text-[var(--color-text-muted)] text-[0.825rem] no-underline rounded-[6px] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all">
                      <Settings size={13} strokeWidth={1.75} /> {t('nav_settings')}
                    </Link>
                    {canAccessAdmin && (
                      <Link to={routes.admin} onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 w-full px-2.5 py-[0.42rem] text-[var(--color-text-muted)] text-[0.825rem] no-underline rounded-[6px] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all">
                        <User size={13} strokeWidth={1.75} /> {t('admin_panel')}
                      </Link>
                    )}
                    <div className="h-px bg-[var(--color-border)] my-1.5" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-2.5 py-[0.42rem] text-[var(--color-text-muted)] text-[0.825rem] font-[inherit] border-0 bg-transparent cursor-pointer text-left rounded-[6px] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)] transition-all">
                      <LogOut size={13} strokeWidth={1.75} /> {t('nav_logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
