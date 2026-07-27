## 1. Database

- [x] 1.1 Write migration adding `profiles.contact_email text` and `profiles.social_links jsonb not null default '[]'::jsonb`
- [x] 1.2 Apply migration to the linked project (`bun run db:push`) and confirm via `supabase db diff --linked` that no drift remains
- [x] 1.3 Regenerate types (`bun run db:types`)
- [x] 1.4 (added after audit) Restrict `profiles_select` RLS to `auth.uid() = id OR map_visible = true` — it was previously `USING (true)`, so `map_visible` was only an app-level query filter, not a real access boundary; every column of every profile (including the new contact_email/social_links, and pre-existing precise location) was publicly readable via the Supabase client regardless of opt-in status

## 2. Types And Validation

- [x] 2.1 Add `SocialPlatform` union type and `SocialLink { platform, url }` to `src/lib/types.ts`; add `contact_email: string | null` and `social_links: SocialLink[]` to `Profile`
- [x] 2.2 Add `contactEmail` (optional email) and `socialLinks` (array of `{platform: enum, url}`, max 5) to the profile Zod schema in `src/lib/validators.ts`

## 3. Settings Form

- [x] 3.1 Extend `SettingsForm`, `formFromProfile`, and `buildProfilePayload` in `src/lib/settingsProfile.ts` for `contact_email` and `social_links`
- [x] 3.2 Add contact email input and a repeatable platform+URL social link editor (max 5) to `src/components/settings/ProfileSettingsSection.tsx` (extracted into `SocialLinksEditor.tsx` to keep the section under the file-size guard)
- [x] 3.3 Add i18n keys for the new labels/placeholders/validation messages across all locales in `src/lib/i18n`
- [x] 3.4 Update/extend `src/lib/settingsProfile.test.ts` for the new fields

## 4. Map Display

- [x] 4.1 Add `contact_email`, `social_links`, `website` to `MapUser` and `fetchMapUsers`'s select list in `src/lib/map.ts`
- [x] 4.2 Render website/contact/social links conditionally on the member card in `src/pages/app/SamideanojPage.tsx`, only for fields that are present (the marker cluster popup itself stays aggregate-only — location, count, "View list" — per the delta spec, which only requires the card)
- [x] 4.3 Add i18n keys/icons needed for the social platform labels used in the card (reused existing `settings_website`/`settings_contact_email` keys plus `SOCIAL_PLATFORM_META`)

## 5. Verification

- [x] 5.1 `bun run typecheck`, `bun run build`, `bun run guard:quality`, `bun run test` — all pass (86 tests)
- [x] 5.2 Dev server boots and serves `/` and `/agordoj` (200); no browser/display available in this environment for a full interactive/visual check — recommend a quick manual pass
- [x] 5.3 `openspec validate add-contact-and-social-links --strict` before archiving — valid

## 6. Audit Fixes (Codex review before archive)

- [x] 6.1 Fixed the `profiles_select` RLS gap (see 1.4) — the blocking finding
- [x] 6.2 `resolveSocialLinks` (`src/lib/settingsProfile.ts`) now identifies which link failed validation (position + platform) instead of a generic message, matching the delta spec scenario wording
- [x] 6.3 Hardened `fetchMapUsers`'s `social_links` read with the same Zod schema used on write (`parseSocialLinks`, falls back to `[]`), so malformed data written outside the app can't crash the map render
- [x] 6.4 Corrected task 4.2 and design.md wording that overstated marker-popup scope (only the member card shows links, per the delta spec — the popup stays aggregate-only)

## 7. Audit Fixes, round 2 (Codex re-review)

- [x] 7.1 The RLS fix in 1.4 regressed username-uniqueness prechecks in `RegisterPage.tsx` and `SettingsPage.tsx` — they queried `profiles` directly and went blind to usernames on hidden (`map_visible = false`) profiles, so a real collision surfaced as a raw unique-constraint error instead of "username already in use". Fixed with a `SECURITY DEFINER` RPC `is_username_available` (migration `20260727120434_add_username_availability_rpc.sql`, boolean-only, no row data exposed) called via new `src/lib/username.ts`'s `assertUsernameAvailable`, used by both pages.
- [x] 7.2 Fixed the stale "81 tests" count in 5.1.
