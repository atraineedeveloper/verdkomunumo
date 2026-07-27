## Why

The app currently ships translations for 9 locales (Esperanto, Spanish, English, Portuguese, Japanese, French, German, Korean, Chinese), but only eo/es/en/pt are actually maintained with real, hand-written translations — ja/fr/de/ko/zh have been silently falling back to English strings for most keys added over time (an existing, already-established pattern in the codebase). The user wants to stop carrying the pretense of supporting languages that aren't really supported and focus the product on its two real audiences: Esperanto speakers (the app's whole reason for existing) and English as the practical lingua franca.

## What Changes

- Reduce `Locale` to `'eo' | 'en'` everywhere; drop es/pt/ja/fr/de/ko/zh.
- Remove the 7 unused locale blocks from `src/lib/i18n/translations.ts` (shrinks the file from ~2000 lines).
- Remove the now-unused flag SVG imports/assets for es/pt/ja/fr/de/ko/zh from `LocaleFlag.tsx` (only `gb` for English stays alongside the Esperanto badge).
- Update `docs/i18n-standards.md`'s supported-locales list.
- **BREAKING** (data, not schema): any user who currently has their locale preference saved in `localStorage` as one of the removed codes will fall back to the configured `fallbackLng` ('eo') on next load — there is no profile-level locale column to migrate, this is client-only state.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `settings-and-preferences`: "Theme And Locale Autosave" requirement gains a scenario making the actual supported locale set (Esperanto, English) explicit and testable, since the requirement text itself doesn't currently name which locales are available.

## Impact

- `src/lib/i18n/translations.ts` (`Locale` type, `LOCALE_LABELS`, `LOCALE_COUNTRY`, 7 locale blocks removed), `src/lib/i18n/translations.test.ts` (`EXPECTED_LOCALES`).
- `src/components/ui/LocaleFlag.tsx` (drop 7 flag imports/mappings).
- `docs/i18n-standards.md`.
- No database/RLS/auth impact — locale is purely client-side (`localStorage`, no `profiles` column).
- No i18next config change needed beyond the shrunk `resources` object (`fallbackLng`/`lng` already default to `'eo'`).
