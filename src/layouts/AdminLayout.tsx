import { NavLink, Outlet } from 'react-router-dom'
import { Shield, FolderTree, Flag, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { routes } from '@/lib/routes'

const navItems = [
  { to: routes.admin, label: 'admin_nav_panel', icon: Shield },
  { to: routes.adminCategories, label: 'admin_nav_categories', icon: FolderTree },
  { to: routes.adminReports, label: 'admin_nav_reports', icon: Flag },
] as const

export function AdminLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[var(--color-bg)] md:flex">
      <aside className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:min-h-screen md:w-[240px] md:flex-shrink-0 md:border-b-0 md:border-r">
        <div className="mb-6 flex items-center gap-2 text-[var(--color-text)]">
          <span className="text-[1.25rem] text-[var(--color-primary)]">★</span>
          <span className="text-base font-bold">Administrado</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === routes.admin}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-sm no-underline transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary-dim)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={16} strokeWidth={1.9} />
              <span>{t(label as never)}</span>
            </NavLink>
          ))}

          <NavLink
            to={routes.feed}
            className="mt-4 flex items-center gap-2 rounded-xl border-t border-[var(--color-border)] px-3 py-3 text-sm text-[var(--color-text-muted)] no-underline transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft size={16} strokeWidth={1.9} />
            <span>{t('admin_nav_back')}</span>
          </NavLink>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
