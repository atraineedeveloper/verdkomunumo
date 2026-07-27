## Why

Real screenshots of Settings (desktop and mobile) surfaced a genuine layout bug introduced by the contact/social-links feature: the platform icon, dropdown, URL input, and remove button each render on their own line instead of a single row, because the global `input,textarea,select { width: 100% }` rule fights the flex row layout. Mobile also clips the "Urbo" (city) field because Lando/Regiono/Urbo never got a responsive stacking rule. Separately, the Settings page has grown into one long undifferentiated card since auth/settings/social-links work landed, and the user wants two new optional profile fields: sex (male/female only) and date of birth — both meant to stay strictly private, never shown to anyone else, not even other opted-in map members.

## What Changes

- Fix the social-link row layout so icon/select/url/remove render in one row (wrapping sanely on narrow screens).
- Add a mobile breakpoint so Lando/Regiono/Urbo stack instead of clipping.
- Regroup the Settings "Profile" card into labeled sub-sections (Identity, Location & map, Contact & social) without changing the single-save-button form behavior.
- Add optional `sex` ('male' | 'female') and `birth_date` fields to profile settings.
- **BREAKING (new privacy model)**: these two fields are NOT added to the `profiles` table. `profiles_select`'s RLS (`auth.uid() = id OR map_visible = true`) makes every column of a `map_visible = true` row readable by anyone via direct API, same as it already does for bio/website/etc. Since the user wants sex/birth_date genuinely private (unlike the contact/social fields, which are meant to become visible once opted into the map), they go in a new `profile_private_details` table with RLS scoped to `auth.uid() = id` only — no `map_visible` clause, no public read path at all, direct API access included.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `settings-and-preferences`: "Profile Settings Explicit Save" extends to cover sex/birth_date (optional, no format validation beyond what native inputs already provide) and the sub-sectioned layout; the social-link editor's scenarios stay behaviorally the same (this is a rendering fix, not a requirement change) so no delta needed there beyond noting the new fields.

## Impact

- New table `profile_private_details` (id references profiles.id, `sex`, `birth_date`, RLS owner-only) + migration.
- `src/lib/types.ts` (`Sex` type, extend the settings form shape — not `Profile` itself, since this data lives outside `profiles`).
- `src/lib/settingsProfile.ts` (fetch/save the private-details row alongside the profile row), `src/lib/validators.ts` (no real validation needed beyond native input types).
- `src/components/settings/ProfileSettingsSection.tsx` (sub-section headings, new fields), `src/components/settings/SocialLinksEditor.tsx` (layout fix), `src/components/settings/settingsStyles.ts` (row-layout fix, mobile breakpoint, sub-section heading style).
- `src/pages/app/SettingsPage.tsx` (load/save the joined private-details row).
- i18n: new keys for sex/birth-date labels and the three sub-section headings (eo/en).
- `src/lib/map.ts`/`SamideanojPage.tsx`: no change — sex/birth_date are never selected there, by design.
