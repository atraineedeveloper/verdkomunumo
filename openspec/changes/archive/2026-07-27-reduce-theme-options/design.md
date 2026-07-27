## Context

`Theme = 'green' | 'dark' | 'vivid' | 'minimal'` (`src/lib/types.ts`) drives: CSS variable blocks per theme in `src/app.css` (applied via a `.theme-<value>` class, set on `document.documentElement` — same pattern as locale), picker button preview colors in `settingsStyles.ts`, the `AppearanceSettingsSection.tsx` picker (already generic, iterates a `themeValues: Theme[]` array), and `Navbar.tsx`'s `cycleTheme()` (also array-driven). `profiles.theme` is a real server-persisted column (`profiles_theme_check` CHECK constraint), unlike locale which is `localStorage`-only — this is the key difference from the earlier language-reduction change.

Direct query against production confirmed 2 real profiles have `theme = 'vivid'` saved; none have `'minimal'`.

## Goals / Non-Goals

**Goals:**
- `Theme` becomes `'green' | 'dark'` everywhere.
- No orphaned data: the 2 `vivid` rows get a valid value before the CHECK constraint narrows, so `ALTER TABLE ... ADD CONSTRAINT` doesn't fail against existing rows.
- No code changes needed in `AppearanceSettingsSection.tsx`/`Navbar.tsx` — both already generic over the `Theme` array/type.

**Non-Goals:**
- Not offering the affected users a heads-up/notification that their theme reverted — same reasoning as the locale change: this is a deliberate product simplification, and green is the app's actual default/primary identity, so falling back to it silently is acceptable.

## Decisions

**Backfill to `'green'`, not `'dark'`.** Green is `DEFAULT 'green'` on the column already and is the app's primary brand identity (`APP_TAGLINE`, the green marker pin on the map, etc.) — the more "neutral default" choice between the two survivors when migrating away from a removed value.

**Single migration does both the backfill and the constraint narrowing, in that order.** `UPDATE ... SET theme = 'green' WHERE theme IN ('vivid', 'minimal')` must run before `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (theme IN ('green','dark'))`, or the constraint addition fails against the still-violating rows. Same file, ordered statements — no need for two separate migrations since there's no reason to deploy the backfill independently of the constraint change.

**No RLS change needed.** `profiles_update_own`'s `WITH CHECK (auth.uid() = id)` doesn't reference `theme` at all (unlike the earlier `role` situation) — narrowing the CHECK constraint is orthogonal to RLS.

## Risks / Trade-offs

- [The 2 users who had `vivid` selected lose their preference silently] → Acceptable, matches the same trade-off already accepted for the locale reduction; they can pick `dark` again from the now-2-option picker if they'd rather not have green.
- [Narrowing a CHECK constraint is technically irreversible without another migration if reverted] → Standard for any constraint change; not a concern given this is a deliberate, confirmed product decision, not exploratory.

## Migration Plan

1. New migration: backfill `vivid`/`minimal` rows to `'green'`, then replace `profiles_theme_check` with `CHECK (theme IN ('green', 'dark'))`.
2. Apply via `bun run db:push`, regenerate types.
3. Ship frontend changes (types, CSS, i18n keys) in the same change.
4. Verify via `supabase db diff --linked` (no drift) and a direct query confirming no row has `theme NOT IN ('green','dark')` post-migration.
