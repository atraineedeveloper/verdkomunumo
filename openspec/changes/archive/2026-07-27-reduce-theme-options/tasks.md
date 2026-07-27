## 1. Database

- [x] 1.1 New migration: backfill `profiles.theme = 'green'` where `theme IN ('vivid', 'minimal')`, then replace `profiles_theme_check` with `CHECK (theme IN ('green', 'dark'))`
- [x] 1.2 Apply via `bun run db:push`; confirm via `supabase db diff --linked` that no drift remains
- [x] 1.3 Regenerate types (`bun run db:types`)
- [x] 1.4 Directly query production to confirm no row has `theme NOT IN ('green', 'dark')` after the migration

## 2. Code

- [x] 2.1 Shrink `Theme` to `'green' | 'dark'` in `src/lib/types.ts`
- [x] 2.2 Remove `.theme-vivid`/`.theme-minimal` blocks from `src/app.css`
- [x] 2.3 Remove the vivid/minimal button preview rules from `src/components/settings/settingsStyles.ts`
- [x] 2.4 Remove `theme_vivid`/`theme_minimal` i18n keys (eo, en) from `src/lib/i18n/translations.ts`
- [x] 2.5 (correction: unlike the locale picker, these are NOT auto-derived) Update the hardcoded `themeValues`/`themeKeys` arrays in `AppearanceSettingsSection.tsx` and the hardcoded `THEMES` array in `Navbar.tsx`'s `cycleTheme()` to `['green', 'dark']`

## 3. Verification

- [x] 3.1 `bun run typecheck`, `bun run build`, `bun run guard:quality`, `bun run test`
- [x] 3.2 `openspec validate reduce-theme-options --strict` before archiving
