import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { translations, type Locale } from './translations'

export { type Locale, type TranslationKey, LOCALE_LABELS, LOCALE_COUNTRY } from './translations'

const STORAGE_KEY = 'verdkomunumo-locale'
const DEFAULT_LOCALE: Locale = 'eo'

const resources = Object.fromEntries(
  Object.entries(translations).map(([lang, t]) => [lang, { translation: t }])
)

const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLocale ?? DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
