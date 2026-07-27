## Why

The contact/social-links feature (`settings-and-preferences`, `map-only-experience`) currently renders website/contact/social icons as plain emoji (🔗 ✉️ 🐦 📷 ✈️ 🐘 📘), which don't read as recognizable brand marks and can render inconsistently across platforms/fonts. The user also wants to add three platforms relevant to the Esperanto community that weren't in the original v1 set: Duolingo (many Esperanto learners connect over it), Threads, and WhatsApp.

## What Changes

- Add a new dependency, `simple-icons`, to render real brand SVG icons (tree-shaken, named ESM imports) instead of emoji for: website (generic link icon), contact email (generic mail icon, via existing `lucide-react`), and every social platform (brand-specific SVG via `simple-icons`).
- Add `duolingo`, `threads`, and `whatsapp` to `SocialPlatform` / `SOCIAL_PLATFORMS` / `SOCIAL_PLATFORM_META`, the Zod enum, the settings picker, and the map card, alongside the existing twitter/instagram/telegram/mastodon/facebook.
- Icons render in each brand's official color (`simple-icons` provides a `hex` per icon), not a flat neutral color.
- Raise `SOCIAL_LINKS_MAX` from 5 to 8 (one for each platform) so a member isn't capped below the number of platforms offered — confirm during implementation whether this is the right ceiling or a smaller cap (e.g. 6) reads better in the UI.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `settings-and-preferences`: "Profile Settings Explicit Save" gains the 3 new platform options in the social-link editor (same validation/save behavior, wider enum).

`map-only-experience`'s "Member cards show contact and social links when present" requirement is platform/icon-style agnostic already (doesn't name specific platforms or an emoji/SVG choice), so no delta needed there — the icon swap is purely an implementation detail under its existing wording.

## Impact

- New dependency: `simple-icons` (already added to `package.json` during research for this proposal).
- `src/lib/constants.ts` (`SOCIAL_PLATFORMS`, `SOCIAL_PLATFORM_META`, `SOCIAL_LINKS_MAX`).
- `src/lib/types.ts` (`SocialPlatform` union).
- `src/lib/validators.ts` (`socialLinksSchema`'s platform enum — already reads from `SOCIAL_PLATFORMS` dynamically, no change needed there beyond the constants update).
- `src/components/settings/SocialLinksEditor.tsx` (platform `<option>` rendering: emoji → brand icon).
- `src/pages/app/SamideanojPage.tsx` (`UserCard`'s website/contact/social link icons: emoji → `lucide-react` + `simple-icons`).
- New small component to render a `simple-icons` SVG (name TBD in design.md).
- i18n: no new keys strictly required (platform labels already come from `SOCIAL_PLATFORM_META`, not translation keys) — confirm this stays acceptable or whether platform names should route through `t()` too.
- No database/RLS/auth impact — this is a purely presentational + enum-widening change; `social_links` is already a schemaless `jsonb` column that accepts any platform string the app's Zod schema allows.
