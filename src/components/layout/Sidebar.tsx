import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '@/lib/constants'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/icons'
import type { Category } from '@/lib/types'
import type { TranslationKey } from '@/lib/i18n'
import { feedWithFilter, routes } from '@/lib/routes'

interface SidebarProps {
  categories?: Category[]
}

export function Sidebar({ categories = [] }: SidebarProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <aside className="w-[210px] flex-shrink-0 flex flex-col gap-6">
      <nav className="flex flex-col">
        <Link
          to={routes.feed}
          className={`flex items-center gap-2 px-2 py-[0.42rem] text-[0.875rem] font-medium rounded-[6px] no-underline transition-all ${pathname === routes.feed ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
        >
          {t('nav_home')}
        </Link>
        <Link
          to={feedWithFilter('following')}
          className={`flex items-center gap-2 px-2 py-[0.42rem] text-[0.875rem] font-medium rounded-[6px] no-underline transition-all ${pathname === routes.feed ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
        >
          {t('nav_following')}
        </Link>
        <Link
          to={routes.communityChat}
          className={`flex items-center gap-2 px-2 py-[0.42rem] text-[0.875rem] font-medium rounded-[6px] no-underline transition-all ${pathname === routes.communityChat ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
        >
          {t('nav_chat', { defaultValue: 'Babilejo' })}
        </Link>
      </nav>

      <div className="flex flex-col gap-2">
        <p className="text-[0.67rem] font-semibold tracking-[0.09em] uppercase text-[var(--color-text-muted)] px-2 m-0">
          {t('nav_categories')}
        </p>
        <nav className="flex flex-col">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug]
            const isActive = pathname.includes(`/kategorio/${cat.slug}`)
            return (
              <Link
                key={cat.slug}
                to={routes.category(cat.slug)}
                className={`flex items-center gap-2 px-2 py-[0.42rem] text-[0.875rem] font-medium rounded-[6px] no-underline transition-all ${isActive ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
              >
                {Icon && (
                  <span className="w-[18px] text-center flex-shrink-0" style={{ color: CATEGORY_COLORS[cat.slug] }}>
                    <Icon size={15} strokeWidth={1.75} />
                  </span>
                )}
                <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                  {t(('cat_name_' + cat.slug) as TranslationKey)}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
