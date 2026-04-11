import { describe, expect, it } from 'vitest'
import { LOCALE_LABELS, LOCALE_COUNTRY, translations, type Locale } from './translations'

const EXPECTED_LOCALES: Locale[] = ['eo', 'es', 'en', 'pt', 'ja', 'fr', 'de', 'ko', 'zh']

describe('i18n translations', () => {
  describe('LOCALE_LABELS', () => {
    it('contains all expected locales', () => {
      EXPECTED_LOCALES.forEach((locale) => {
        expect(LOCALE_LABELS).toHaveProperty(locale)
        expect(typeof LOCALE_LABELS[locale]).toBe('string')
        expect(LOCALE_LABELS[locale].length).toBeGreaterThan(0)
      })
    })

    it('has specific expected labels', () => {
      expect(LOCALE_LABELS).toHaveProperty('eo', 'Esperanto')
      expect(LOCALE_LABELS).toHaveProperty('en', 'English')
      expect(LOCALE_LABELS).toHaveProperty('fr', 'Français')
    })

    it('has no extra locales', () => {
      const keys = Object.keys(LOCALE_LABELS)
      expect(keys.length).toBe(EXPECTED_LOCALES.length)
    })
  })

  describe('LOCALE_COUNTRY', () => {
    it('contains all expected locales', () => {
      EXPECTED_LOCALES.forEach((locale) => {
        expect(LOCALE_COUNTRY).toHaveProperty(locale)
        if (locale === 'eo') {
          expect(LOCALE_COUNTRY[locale]).toBeNull()
        } else {
          expect(typeof LOCALE_COUNTRY[locale]).toBe('string')
          expect(LOCALE_COUNTRY[locale]?.length).toBeGreaterThan(0)
        }
      })
    })

    it('has specific expected country codes', () => {
      expect(LOCALE_COUNTRY).toHaveProperty('eo', null)
      expect(LOCALE_COUNTRY).toHaveProperty('en', 'gb')
      expect(LOCALE_COUNTRY).toHaveProperty('fr', 'fr')
    })

    it('has no extra locales', () => {
      const keys = Object.keys(LOCALE_COUNTRY)
      expect(keys.length).toBe(EXPECTED_LOCALES.length)
    })
  })

  describe('translations', () => {
    it('contains all expected locales', () => {
      EXPECTED_LOCALES.forEach((locale) => {
        expect(translations).toHaveProperty(locale)
      })
    })

    it('has no extra locales', () => {
      const keys = Object.keys(translations)
      expect(keys.length).toBe(EXPECTED_LOCALES.length)
    })

    it('has no empty translations', () => {
      const locales = Object.keys(translations) as Locale[]
      locales.forEach((locale) => {
        const localeTranslations = translations[locale] as Record<string, string>
        Object.entries(localeTranslations).forEach(([key, value]) => {
          expect(value.length, `Translation for key "${key}" in locale "${locale}" should not be empty`).toBeGreaterThan(0)
        })
      })
    })
  })
})
