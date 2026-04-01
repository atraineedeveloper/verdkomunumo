import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Bell, MessageCircle, User, LogIn } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { routes } from '@/lib/routes'

interface MobileNavProps {
  unreadNotificationsCount?: number
  unreadMessagesCount?: number
}

export function MobileNav({ unreadNotificationsCount = 0, unreadMessagesCount = 0 }: MobileNavProps) {
  const { pathname } = useLocation()
  const profile = useAuthStore((s) => s.profile)

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-[var(--color-bg)] border-t border-[var(--color-border)] px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)]">
      <Link to={routes.feed} className={`flex-1 flex items-center justify-center py-2.5 no-underline transition-colors ${pathname === routes.feed ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
        <Home size={21} strokeWidth={pathname === routes.feed ? 2.5 : 1.75} />
      </Link>

      <Link to={routes.search} className={`flex-1 flex items-center justify-center py-2.5 no-underline transition-colors ${pathname === routes.search ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
        <Search size={21} strokeWidth={pathname === routes.search ? 2.5 : 1.75} />
      </Link>

      {profile ? (
        <>
          <Link to={routes.notifications} className={`relative flex-1 flex items-center justify-center py-2.5 no-underline transition-colors ${pathname === routes.notifications ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
            <Bell size={21} strokeWidth={pathname === routes.notifications ? 2.5 : 1.75} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] bg-[var(--color-danger)] text-white text-[0.58rem] font-bold min-w-[14px] h-[14px] px-[3px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-bg)]">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </Link>

          <Link to={routes.messages} className={`relative flex-1 flex items-center justify-center py-2.5 no-underline transition-colors ${pathname === routes.messages ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
            <MessageCircle size={21} strokeWidth={pathname === routes.messages ? 2.5 : 1.75} />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] bg-[var(--color-danger)] text-white text-[0.58rem] font-bold min-w-[14px] h-[14px] px-[3px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-bg)]">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </Link>

          <Link
            to={routes.profile(profile.username)}
            className={`flex-1 flex items-center justify-center py-2.5 no-underline transition-colors ${pathname.startsWith('/profilo') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
          >
            <User size={21} strokeWidth={pathname.startsWith('/profilo') ? 2.5 : 1.75} />
          </Link>
        </>
      ) : (
        <Link to={routes.login} className="flex-1 flex items-center justify-center py-2.5 no-underline text-[var(--color-primary)] gap-1.5">
          <LogIn size={21} strokeWidth={1.75} />
        </Link>
      )}
    </nav>
  )
}
