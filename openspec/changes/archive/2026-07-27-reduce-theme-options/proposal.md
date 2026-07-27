## Why

The app offers 4 themes (green, dark, vivid, minimal). The user wants to reduce this to just the main green theme and dark mode, simplifying the appearance settings.

## What Changes

- Reduce `Theme` to `'green' | 'dark'` everywhere; drop `vivid` and `minimal`.
- Remove the `.theme-vivid`/`.theme-minimal` CSS variable blocks (`src/app.css`) and their picker-button preview colors (`src/components/settings/settingsStyles.ts`).
- Remove the `theme_vivid`/`theme_minimal` i18n keys (eo/en).
- **Data migration required**: 2 real production profiles currently have `theme = 'vivid'` saved. A new migration backfills them to `'green'` (the default) before narrowing `profiles_theme_check` to `('green', 'dark')`, since the old CHECK constraint would otherwise reject the narrower set while violating rows still exist.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `settings-and-preferences`: "Theme And Locale Autosave" requirement gains a scenario making the actual theme set (green, dark) explicit, same as the locale scenario added in a prior change.

## Impact

- `src/lib/types.ts` (`Theme` union).
- `src/app.css`, `src/components/settings/settingsStyles.ts` (remove vivid/minimal CSS).
- `src/lib/i18n/translations.ts` (remove 2 keys × 2 locales).
- `src/components/settings/AppearanceSettingsSection.tsx`, `src/components/layout/Navbar.tsx`: no code change needed — both already derive their theme list from a `Theme[]` array/type, same pattern as the locale reduction.
- New Supabase migration: backfill `profiles.theme = 'green'` where currently `'vivid'` or `'minimal'`, then narrow `profiles_theme_check`.
