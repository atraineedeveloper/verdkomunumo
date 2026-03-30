import { writable, derived } from 'svelte/store'
import { translations, type Locale, type TranslationKey } from './translations'

export { type Locale, type TranslationKey, LOCALE_LABELS, LOCALE_COUNTRY } from './translations'

const STORAGE_KEY = 'verdkomunumo-locale'
const DEFAULT_LOCALE: Locale = 'eo'

function createLocaleStore() {
  const { subscribe, set } = writable<Locale>(DEFAULT_LOCALE)

  return {
    subscribe,
    setLocale: (locale: Locale) => {
      set(locale)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, locale)
      }
    },
    init: () => {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
        if (saved && saved in translations) set(saved)
      }
    }
  }
}

export const locale = createLocaleStore()

// t() reactive translation function
export const t = derived(locale, ($locale) => {
  const localeTranslations = translations[$locale] as Record<string, string>
  const defaultTranslations = translations[DEFAULT_LOCALE] as Record<string, string>

  return (key: TranslationKey): string => {
    return localeTranslations[key] ?? defaultTranslations[key] ?? key
  }
})
