## 1. Database

- [x] 1.1 New migration: create `profile_private_details` (id references profiles(id) on delete cascade, sex text check in ('male','female'), birth_date date, updated_at) with RLS owner-only (select/insert/update, no map_visible clause)
- [x] 1.2 Apply via `bun run db:push`; confirm via `supabase db diff --linked` that no drift remains
- [x] 1.3 Regenerate types (`bun run db:types`)
- [x] 1.4 Directly verify via REST (anon key, no session) that a map-visible test row's `profile_private_details` is unreachable
- [x] 1.5 (found during verification) Add a follow-up migration documenting the table's default anon/authenticated/service_role grants explicitly (they applied implicitly on push, same as `rls_auto_enable`, but weren't in the migration file — `db diff --linked` flagged real drift without them)

## 2. Types And Data Layer

- [x] 2.1 Add `Sex` type to `src/lib/types.ts`
- [x] 2.2 Extend `SettingsForm`/`formFromProfile` in `src/lib/settingsProfile.ts` for `sex`/`birth_date`
- [x] 2.3 `SettingsPage.tsx`: fetch profile with embedded `profile_private_details(sex, birth_date)`; save via upsert into `profile_private_details` alongside the existing profile update

## 3. Bug Fixes (found via screenshot, not cosmetic taste)

- [x] 3.1 Fix `SocialLinksEditor.tsx`/`settingsStyles.ts` so icon/select/url/remove render in one row (new `.social-link-row` class, `width: auto` overrides), wrapping sanely on narrow screens
- [x] 3.2 Add `@media (max-width: 520px)` stacking Lando/Regiono/Urbo so `Urbo` stops clipping on mobile

## 4. Settings Visual Regrouping

- [x] 4.1 Add `.subsection-title` style; split the Profile card into Identity / Location & map / Contact & social sub-groups (same form, same single save button)
- [x] 4.2 Add sex (`<select>`) and birth date (`<input type="date">`) fields to the Identity sub-group
- [x] 4.3 i18n keys for the 3 sub-section headings and the sex/birth-date labels (eo/en)

## 5. Verification

- [x] 5.1 `bun run typecheck`, `bun run build`, `bun run guard:quality`, `bun run test`
- [x] 5.2 Re-screenshot Settings (desktop + mobile) via the E2E auth-override mechanism; confirm the social-link row and Urbo field render correctly, and the sub-sections read clearly
- [x] 5.3 `openspec validate add-private-profile-fields-and-settings-polish --strict` before archiving
