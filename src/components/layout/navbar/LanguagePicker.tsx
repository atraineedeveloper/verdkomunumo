import { useTranslation } from 'react-i18next'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'
import i18n from '@/lib/i18n'
import { LocaleFlag } from '@/components/ui/LocaleFlag'

const LOCALES = Object.keys(LOCALE_LABELS) as Locale[]

interface LanguagePickerProps {
  showLangMenu: boolean
  setShowLangMenu: (show: boolean) => void
  setShowUserMenu: (show: boolean) => void
}

export function LanguagePicker({ showLangMenu, setShowLangMenu, setShowUserMenu }: LanguagePickerProps) {
  const { t } = useTranslation()
  const locale = i18n.language as Locale

  const selectLocale = (newLocale: Locale) => {
    i18n.changeLanguage(newLocale)
    document.documentElement.lang = newLocale
    setShowLangMenu(false)
  }

  return (
    <div className="relative">
      <button
        className="flex items-center justify-center w-[34px] h-[34px] rounded-[6px] bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all"
        title={t('nav_change_lang')}
        aria-label={t('nav_change_lang')}
        onClick={() => { setShowLangMenu(!showLangMenu); setShowUserMenu(false) }}
      >
        <LocaleFlag locale={locale} className="block w-5 h-[15px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" />
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
                <LocaleFlag locale={l} className="block w-5 h-[15px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)] flex-shrink-0" />
                <span>{LOCALE_LABELS[l]}</span>
                {locale === l && <span className="ml-auto text-[0.75rem]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
