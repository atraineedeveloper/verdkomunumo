import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Map, Palette, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { APP_NAME } from '@/lib/constants'
import { routes } from '@/lib/routes'
import { supabase } from '@/lib/supabase/client'
import type { Theme } from '@/lib/types'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const THEMES: Theme[] = ['green', 'dark', 'vivid', 'minimal']

export function Navbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clear)
  const { theme, setTheme } = useThemeStore()
  const [isSigningOut, setIsSigningOut] = useState(false)

  function cycleTheme() {
    const currentIndex = THEMES.indexOf(theme)
    setTheme(THEMES[(currentIndex + 1) % THEMES.length])
  }

  async function handleLogout() {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    clearAuth()
    navigate(routes.login)
  }

  return (
    <nav className="sticky top-0 z-[100] bg-[var(--color-bg)] border-b border-[var(--color-border)]">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 h-[56px] flex items-center gap-2">
        <Link to={routes.map} className="flex items-center gap-2 no-underline text-[var(--color-text)] font-bold">
          <Map size={20} className="text-[var(--color-primary)]" aria-hidden />
          <span>{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-1 ml-auto">
          <Link
            to={routes.map}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-[6px] text-[0.82rem] font-medium text-[var(--color-text-muted)] no-underline hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
          >
            <Map size={16} aria-hidden />
            <span className="hidden sm:inline">{t('nav_samideanoj', { defaultValue: 'Mapo' })}</span>
          </Link>
          <Link
            to={routes.settings}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-[6px] text-[0.82rem] font-medium text-[var(--color-text-muted)] no-underline hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
          >
            <Settings size={16} aria-hidden />
            <span className="hidden sm:inline">{t('nav_settings')}</span>
          </Link>
          <button
            type="button"
            onClick={cycleTheme}
            className="flex items-center justify-center w-[36px] h-[36px] rounded-[6px] bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            title={t('nav_change_theme')}
            aria-label={t('nav_change_theme')}
          >
            <Palette size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isSigningOut}
            className="flex items-center justify-center w-[36px] h-[36px] rounded-[6px] bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)] disabled:opacity-50"
            title={t('nav_logout')}
            aria-label={t('nav_logout')}
          >
            <LogOut size={16} aria-hidden />
          </button>
        </div>
      </div>
    </nav>
  )
}
