## Context

`Locale = 'eo' | 'es' | 'en' | 'pt' | 'ja' | 'fr' | 'de' | 'ko' | 'zh'` (`src/lib/i18n/translations.ts`) drives `LOCALE_LABELS`, `LOCALE_COUNTRY` (flag-icons country codes), the `translations` resource object fed into i18next (`src/lib/i18n/index.ts`), and the flag-icon lookup in `src/components/ui/LocaleFlag.tsx`. Locale is purely client-side state: `localStorage['verdkomunumo-locale']`, defaulting to `'eo'` (both `lng` and `fallbackLng`). There is no `profiles` column or server-side concept of locale — nothing in the database or RLS is touched by this change.

Of the 9 locales, only eo/es/en/pt have real hand-written translations for every key added over time; ja/fr/de/ko/zh have been falling back to English text for most newer keys already (an established pattern visible throughout `translations.ts`), so removing them loses no real translation work, just the pretense of coverage.

## Goals / Non-Goals

**Goals:**
- `Locale` becomes `'eo' | 'en'` everywhere, with no dead code referencing the removed 7.
- `translations.ts` only carries the `eo` and `en` blocks.
- The language picker (`AppearanceSettingsSection.tsx`) only offers Esperanto and English — no code changes needed there since it already iterates `Object.keys(LOCALE_LABELS)` generically.
- Bundle size drops: 7 unused flag SVGs (`es`, `br`, `jp`, `fr`, `de`, `kr`, `cn`) stop being imported/bundled by `LocaleFlag.tsx`.

**Non-Goals:**
- No migration of user locale preference — it's `localStorage` only, not server state, so there's nothing to migrate; a user with a removed locale saved just falls back to `'eo'` on next load per existing `fallbackLng` behavior.
- Not re-translating or improving the remaining eo/en content — pure removal, no content changes to surviving keys.
- Not touching `country-state-city`/`src/lib/countries.ts` or `src/lib/country-names-eo.ts` — those are location-field country/region/city names for the map/settings feature, an unrelated concept from the app's UI locale.

## Decisions

**Delete the 7 locale blocks outright rather than commenting them out or archiving them.** They're fully recoverable from git history if ever needed again; keeping dead translation blocks around (even "disabled") is exactly the kind of stale content `docs/documentation-governance.md` calls out as an anti-pattern, and it would keep confusing future contributors about what's actually supported.

**No i18next config changes beyond the shrunk `resources` object.** `lng`/`fallbackLng` are already `'eo'`; a saved `localStorage` value of a removed locale (e.g. `'fr'`) simply won't match any key in the new `resources` object, and i18next will render fallback (English, since `fallbackLng: 'eo'`... actually falls back to `'eo'` — confirm this is the desired behavior, see Open Questions) with no error. No explicit migration/cleanup of stale `localStorage` values is needed; the next language pick overwrites it.

**`AppearanceSettingsSection.tsx` needs no code change.** It already derives its list of language buttons from `Object.keys(LOCALE_LABELS)` generically — shrinking `LOCALE_LABELS` to 2 entries automatically shrinks the UI to 2 buttons.

## Risks / Trade-offs

- [A user with a removed locale saved in `localStorage` (e.g. an `fr` visitor) silently reverts to Esperanto, not English, on next visit] → This follows directly from `fallbackLng: 'eo'` already being the app's default; acceptable since Esperanto is the app's core audience/identity, and the user can immediately re-pick English from the now-2-option list. Worth confirming this is the desired fallback (see Open Questions) rather than switching `fallbackLng` to `'en'` as part of this change.
- [`translations.test.ts` hardcodes `EXPECTED_LOCALES` with all 9] → Must update in the same change or the suite breaks immediately; low risk, caught by `bun run test`.

## Migration Plan

1. Shrink `Locale`, `LOCALE_LABELS`, `LOCALE_COUNTRY`, and delete the 7 locale blocks in `translations.ts`.
2. Update `translations.test.ts`'s `EXPECTED_LOCALES`.
3. Remove the 7 unused flag imports/mappings in `LocaleFlag.tsx`.
4. Update `docs/i18n-standards.md` and `openspec/config.yaml`'s injected `context:` (still lists all 9 locales — feeds every future OpenSpec proposal).
5. No deploy/rollback complexity beyond a normal frontend deploy — no DB migration, no backend change.

## Open Questions

- Should `fallbackLng` switch from `'eo'` to `'en'`? Keeping `'eo'` is more true to the app's identity but means a removed-locale visitor lands on Esperanto rather than the more broadly understood English. Defaulting to keep `'eo'` unless told otherwise during implementation.
