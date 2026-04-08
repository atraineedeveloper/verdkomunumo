import brFlag from 'flag-icons/flags/4x3/br.svg'
import cnFlag from 'flag-icons/flags/4x3/cn.svg'
import deFlag from 'flag-icons/flags/4x3/de.svg'
import esFlag from 'flag-icons/flags/4x3/es.svg'
import frFlag from 'flag-icons/flags/4x3/fr.svg'
import gbFlag from 'flag-icons/flags/4x3/gb.svg'
import jpFlag from 'flag-icons/flags/4x3/jp.svg'
import krFlag from 'flag-icons/flags/4x3/kr.svg'
import type { Locale } from '@/lib/i18n'

const FLAG_BY_LOCALE: Partial<Record<Locale, string>> = {
  es: esFlag,
  en: gbFlag,
  pt: brFlag,
  ja: jpFlag,
  fr: frFlag,
  de: deFlag,
  ko: krFlag,
  zh: cnFlag,
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
