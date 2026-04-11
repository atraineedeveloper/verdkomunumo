import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, MessageCircle, Palette, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { APP_NAME } from '@/lib/constants'
import type { Theme } from '@/lib/types'
import { routes } from '@/lib/routes'

import { LanguagePicker } from './navbar/LanguagePicker'
import { UserMenu } from './navbar/UserMenu'

const THEMES: Theme[] = ['green', 'dark', 'vivid', 'minimal']

interface NavbarProps {
  unreadNotificationsCount?: number
  unreadMessagesCount?: number
}

export function Navbar({ unreadNotificationsCount = 0, unreadMessagesCount = 0 }: NavbarProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useThemeStore()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const initialized = useAuthStore((s) => s.initialized)
  const navigate = useNavigate()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [cachedProfile, setCachedProfile] = useState(profile)
  const displayProfile = profile ?? (user ? cachedProfile : null)

  useEffect(() => {
    if (!user) {
      setCachedProfile(null)
      setShowUserMenu(false)
      return
    }

    if (profile?.id === user.id) {
      setCachedProfile(profile)
      return
    }

    if (cachedProfile && cachedProfile.id !== user.id) {
      setCachedProfile(null)
    }
  }, [user, profile, cachedProfile])

  function cycleTheme() {
    const idx = THEMES.indexOf(theme)
    setTheme(THEMES[(idx + 1) % THEMES.length])
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
          <span className="text-[0.68rem] font-bold tracking-wider uppercase text-[#14532d] bg-[#dcfce7] border border-[#86efac] px-1.5 py-0.5 rounded-full self-start mt-0.5">
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
          <LanguagePicker
            showLangMenu={showLangMenu}
            setShowLangMenu={setShowLangMenu}
            setShowUserMenu={setShowUserMenu}
          />

          {/* Theme cycle */}
          <button
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
            title={t('nav_change_theme')}
            aria-label={t('nav_change_theme')}
            onClick={cycleTheme}
          >
            <Palette size={16} strokeWidth={1.75} />
          </button>

          {/* Notifications — logged-in only */}
          {user && (
            <Link
              to={routes.notifications}
              title={t('nav_notifications')}
              aria-label={t('nav_notifications')}
              className="relative flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent text-[var(--color-text-muted)] no-underline hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
            >
              <Bell size={16} strokeWidth={1.75} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 bg-[var(--color-danger)] text-white text-[0.65rem] font-bold min-w-[16px] h-[16px] px-[3px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-bg)]">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </Link>
          )}

          {/* Messages — logged-in only */}
          {user && (
            <Link
              to={routes.messages}
              title={t('nav_messages')}
              aria-label={t('nav_messages')}
              className="relative flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent text-[var(--color-text-muted)] no-underline hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
            >
              <MessageCircle size={16} strokeWidth={1.75} />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 bg-[var(--color-danger)] text-white text-[0.65rem] font-bold min-w-[16px] h-[16px] px-[3px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-bg)]">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </Link>
          )}

          {/* Guest CTA */}
          {initialized && !user && (
            <Link
              to={routes.login}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white text-[0.8rem] font-semibold rounded-[6px] no-underline hover:opacity-90 transition-opacity"
            >
              {t('nav_login')}
            </Link>
          )}

          {/* Avatar / user menu */}
          {displayProfile && (
            <UserMenu
              displayProfile={displayProfile}
              showUserMenu={showUserMenu}
              setShowUserMenu={setShowUserMenu}
              setShowLangMenu={setShowLangMenu}
            />
          )}
        </div>
      </div>
    </nav>
  )
}
