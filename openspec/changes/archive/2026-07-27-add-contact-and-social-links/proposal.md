## Why

Members can currently list a personal website on their profile, but have no way to share a direct contact method or their social network presence. Other members who find them on the map have no way to reach out beyond the site itself. Adding contact info and social links closes that gap with minimal added surface.

## What Changes

- Add an optional public contact email field to profile settings, separate from the private login email.
- Add optional social network links (a small, extensible list of platform + URL pairs) to profile settings.
- Show website, contact email, and social links on the map member list/cards when a member has filled them in — the same public surface where opted-in members already appear (today `website` is stored but never actually shown anywhere, which this change also fixes).
- Validate each provided URL/email the same way the existing `website` field is validated.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `settings-and-preferences`: "Profile Settings Explicit Save" requirement extends to cover the new contact email and social links fields (same explicit-save behavior, validation, and success/error feedback as existing profile fields).
- `map-only-experience`: member cards in the map list gain a requirement to display website/contact/social links when present, on the same opt-in public surface as the rest of the card.

## Impact

- `profiles` table: two new nullable columns (`contact_email`, `social_links`) via a new Supabase migration.
- `src/lib/types.ts` (`Profile`), `src/lib/validators.ts`, `src/lib/settingsProfile.ts` (form/payload), `src/components/settings/ProfileSettingsSection.tsx` (settings UI), `src/pages/app/SamideanojPage.tsx` (map card display), `src/lib/map.ts`/`fetchMapUsers` (select the new columns), `database.types.ts` (regenerated).
- i18n: new translation keys for the added labels/placeholders across all locales.
- No auth or cache-key impact: `profiles_select`/`profiles_update_own` already cover any column on the table (both fields join the same public-if-map-visible exposure model as existing map card fields); no new query keys are introduced (`queryKeys.mapUsers()` and the existing profile update mutation already cover this).
