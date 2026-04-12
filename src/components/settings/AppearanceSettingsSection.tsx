import { LocaleFlag } from '@/components/ui/LocaleFlag'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'
import type { Theme } from '@/lib/types'

const themeValues: Theme[] = ['green', 'dark', 'vivid', 'minimal']
const themeKeys = ['theme_green', 'theme_dark', 'theme_vivid', 'theme_minimal'] as const
const locales = Object.keys(LOCALE_LABELS) as Locale[]

interface AppearanceSettingsSectionProps {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  onThemeChange: (theme: Theme) => void
  themePending: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

export function AppearanceSettingsSection({
  locale,
  onLocaleChange,
  onThemeChange,
  themePending,
  t,
}: AppearanceSettingsSectionProps) {
  return (
    <>
      <section className="section">
        <h2 className="section-title">{t('settings_theme')}</h2>
        <div className="theme-grid">
          {themeValues.map((themeValue, index) => (
            <button
              key={themeValue}
              className={`theme-btn theme-${themeValue}`}
              type="button"
              onClick={() => onThemeChange(themeValue)}
              disabled={themePending}
            >
              {t(themeKeys[index])}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t('settings_language')}</h2>
        <div className="theme-grid">
          {locales.map((nextLocale) => (
            <button
              key={nextLocale}
              className={`lang-btn-big ${locale === nextLocale ? 'active' : ''}`}
              type="button"
              onClick={() => onLocaleChange(nextLocale)}
            >
              <LocaleFlag locale={nextLocale} className="lang-flag" />
              <span>{LOCALE_LABELS[nextLocale]}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
