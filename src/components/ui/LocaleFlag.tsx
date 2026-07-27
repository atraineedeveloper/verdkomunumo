import gbFlag from 'flag-icons/flags/4x3/gb.svg'
import type { Locale } from '@/lib/i18n'

const FLAG_BY_LOCALE: Partial<Record<Locale, string>> = {
  en: gbFlag,
}

type LocaleFlagProps = {
  locale: Locale
  className?: string
}

export function LocaleFlag({ locale, className = '' }: LocaleFlagProps) {
  const flagSrc = FLAG_BY_LOCALE[locale]

  if (!flagSrc) {
    return (
      <span className={`inline-flex items-center justify-center bg-[#14532d] text-white text-[0.68rem] font-bold tracking-wide ${className}`.trim()}>
        EO
      </span>
    )
  }

  return <img src={flagSrc} alt="" aria-hidden="true" className={className} loading="lazy" decoding="async" />
}
