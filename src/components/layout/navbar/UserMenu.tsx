import { Link, useNavigate } from 'react-router-dom'
import { Settings, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase/client'
import { routes } from '@/lib/routes'
import { getAvatarUrl, hasRequiredRole } from '@/lib/utils'

interface UserMenuProps {
  displayProfile: {
    username: string
    display_name: string
    avatar_url: string | null
    role: import('@/lib/types').UserRole
  }
  showUserMenu: boolean
  setShowUserMenu: (show: boolean) => void
  setShowLangMenu: (show: boolean) => void
}

export function UserMenu({ displayProfile, showUserMenu, setShowUserMenu, setShowLangMenu }: UserMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clear)
  const canAccessAdmin = hasRequiredRole(displayProfile.role, 'moderator')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    setShowUserMenu(false)
    navigate(routes.login)
  }

  return (
    <div className="relative">
      <button
        className="p-0 border-0 bg-transparent cursor-pointer rounded-full flex"
        aria-label={t('nav_profile')}
        title={t('nav_profile')}
        onClick={() => { setShowUserMenu(!showUserMenu); setShowLangMenu(false) }}
      >
        <img
          src={getAvatarUrl(displayProfile.avatar_url, displayProfile.display_name)}
          alt={displayProfile.display_name}
          className="w-[30px] h-[30px] rounded-full object-cover border-[1.5px] border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
        />
      </button>
      {showUserMenu && (
        <>
          <button className="fixed inset-0 z-[90] bg-transparent border-0 cursor-default p-0" onClick={() => setShowUserMenu(false)} tabIndex={-1} aria-hidden />
          <div className="absolute top-[calc(100%+8px)] right-0 z-[100] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[10px] min-w-[168px] p-1.5 shadow-lg animate-[pop_0.12s_ease]">
            <div className="px-2.5 py-2 pb-1.5 flex flex-col gap-px">
              <span className="text-[0.825rem] font-semibold text-[var(--color-text)]">{displayProfile.display_name}</span>
              <span className="text-[0.75rem] text-[var(--color-text-muted)]">@{displayProfile.username}</span>
            </div>
            <div className="h-px bg-[var(--color-border)] my-1.5" />
            <Link to={routes.profile(displayProfile.username)} onClick={() => setShowUserMenu(false)}
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
  )
}
