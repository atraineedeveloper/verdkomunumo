## 1. Core i18n

- [x] 1.1 Shrink `Locale` to `'eo' | 'en'` in `src/lib/i18n/translations.ts`
- [x] 1.2 Shrink `LOCALE_LABELS` and `LOCALE_COUNTRY` to eo/en entries only
- [x] 1.3 Delete the es/pt/ja/fr/de/ko/zh translation blocks, keeping only `eo` and `en`
- [x] 1.4 Update `src/lib/i18n/translations.test.ts`'s `EXPECTED_LOCALES` to `['eo', 'en']`

## 2. UI

- [x] 2.1 Remove the 7 unused flag imports/mappings (`es`, `br`, `jp`, `fr`, `de`, `kr`, `cn`) from `src/components/ui/LocaleFlag.tsx`, keeping only `gb` for English
- [x] 2.2 Confirm `AppearanceSettingsSection.tsx` needs no change (it derives its list from `LOCALE_LABELS` already) — verify by reading, don't assume

## 3. Docs

- [x] 3.1 Update `docs/i18n-standards.md`'s "Supported Locales" list to Esperanto and English only
- [x] 3.2 Update `openspec/config.yaml`'s injected `context:` line that lists all 9 locales

## 4. Verification

- [x] 4.1 `bun run typecheck`, `bun run build`, `bun run guard:quality`, `bun run test`
- [x] 4.2 Grep the repo for any remaining reference to a removed locale code (`'es'`, `'pt'`, `'ja'`, `'fr'`, `'de'`, `'ko'`, `'zh'`) outside of unrelated contexts (e.g. `country-state-city` data, git history) to confirm nothing was missed
- [x] 4.3 `openspec validate reduce-supported-languages --strict` before archiving
