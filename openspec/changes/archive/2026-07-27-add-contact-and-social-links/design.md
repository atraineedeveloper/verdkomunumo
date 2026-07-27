## Context

Profiles today store a `website` field (`profiles.website`, validated as an optional URL) that is editable in Settings but never actually rendered anywhere — there is no public profile page in this map-only app, and the map's member list (`src/pages/app/SamideanojPage.tsx`) only renders avatar, display name, username, and structured location via `fetchMapUsers` (`src/lib/map.ts`), which selects an explicit column list from `profiles` filtered to `map_visible = true`.

Members asked for a way to be reachable once found on the map: a contact email and social network links, shown wherever the rest of their opted-in public info already appears.

## Goals / Non-Goals

**Goals:**
- Let a member store a contact email and a small set of social links, with the same explicit-save/validate/feedback pattern as existing profile fields.
- Make website, contact email, and social links actually visible on the map member list for anyone who filled them in — closing the gap where `website` is currently invisible.
- Keep the new fields inside the existing opt-in exposure model: only shown for members who already have `map_visible = true` (no new consent mechanism).

**Non-Goals:**
- No new "public profile page" route — display happens on the existing map list/card, not a new surface.
- No arbitrary-length social link list or platform auto-detection; a small fixed set of common platforms is enough for v1.
- No messaging/DM feature — this only surfaces contact methods that live outside the app (email client, external social platforms).

## Decisions

**Social links as a small JSON column, not one column per platform.** Stored as `social_links jsonb` — an array of `{ "platform": string, "url": string }` objects. Alternative considered: one text column per platform (e.g. `social_twitter`, `social_instagram`). Rejected because it means a migration every time a new platform is added and most rows would be mostly-null columns; a JSON array keeps the schema stable while the app-level Zod schema still constrains which platforms/shapes are accepted. Consistent with treating this as profile-level flexible metadata rather than structured relational data (no querying/filtering by platform is needed).

**Fixed platform enum, validated at the app layer, not the DB layer.** `SocialPlatform = 'twitter' | 'instagram' | 'telegram' | 'mastodon' | 'facebook'` lives in `src/lib/types.ts`; `socialLinksSchema` (Zod) in `src/lib/validators.ts` validates `{platform: enum, url: url}[]` with a max of 5 entries. The DB column stays a plain `jsonb` with no CHECK constraint — matches how `Profile`'s other optional structured fields (e.g. location) are validated in the app, not the database, keeping the migration trivial to extend later (new platform = enum change + i18n key, no migration).

**`contact_email` is a plain nullable text column, validated as an email.** Deliberately separate from `auth.users.email` (the private login email) — reusing the login email would either leak it involuntarily to anyone opting into the map, or require a "use my login email" toggle that adds UI complexity for no real benefit over just typing it in. A blank/unset `contact_email` means "not shown," same pattern as `website`.

**Visibility rides `map_visible`, enforced at the RLS layer, not just the app query.** Anyone who opts into the map has their name, avatar, and location public; adding website/contact/social to that same public card doesn't introduce a new sensitivity tier — but this only holds if `map_visible` is actually a security boundary, not just an app-level filter. Audit caught that it wasn't: `profiles_select` was `USING (true)`, so any authenticated or anonymous client could already read every column of every profile — including a non-opted-in member's precise `location_lat`/`location_lng` — directly via the Supabase client, regardless of `map_visible`. Fixed in a follow-up migration (`20260727114915_restrict_profiles_select_to_map_visible.sql`): `profiles_select` is now `USING (auth.uid() = id OR map_visible = true)`. This also retroactively closes the same gap for every pre-existing column (bio, website, location), not just the two added here.

This tightening broke a read I initially missed: the username-uniqueness prechecks in `RegisterPage.tsx` and `SettingsPage.tsx` queried `profiles` directly for a matching username, which now silently misses collisions against hidden (`map_visible = false`) profiles — the precheck would say "available" and the real `INSERT`/`UPDATE` would then fail on the `profiles.username` unique constraint with a raw Postgres error instead of the friendly message. Fixed with a second follow-up migration (`20260727120434_add_username_availability_rpc.sql`) adding `is_username_available(check_username, exclude_id)`, a `SECURITY DEFINER` RPC that returns only a boolean (no profile data) and is grantable to `anon`/`authenticated` regardless of `map_visible` — same pattern as `resolve_login_email`. Both pages now call it via `src/lib/username.ts`'s `assertUsernameAvailable`.

Full accounting of legitimate cross-user `profiles` access after this change: `fetchMapUsers` (filters to `map_visible = true`), `resolve_login_email` (`SECURITY DEFINER`, bypasses RLS, revoked from direct client calls), and `is_username_available` (`SECURITY DEFINER`, boolean-only, no row data exposed).

**Card rendering is conditional per-field.** Each of website/contact_email/social_links renders only if present; a member who fills in none of them sees the card exactly as it looks today. Rendered as small icon-links in the existing map list card, sitting below the location line. The marker cluster popup (which aggregates multiple members at one location) stays as-is — location, count, "View list" — since it isn't a per-member surface.

## Risks / Trade-offs

- [Spam exposure of a public contact email] → Mitigated by this being opt-in twice over (member must both enable `map_visible` and fill in `contact_email`); documented in the settings help text so the choice is informed. No further mitigation (e.g. obfuscation) is in scope for v1.
- [`jsonb` column bypasses DB-level shape validation] → Mitigated by Zod validation at the mutation boundary (`buildProfilePayload`) before any write, and by re-validating with the same schema on read in `fetchMapUsers` (`parseSocialLinks`, falling back to `[]` on shape mismatch) so a row written outside the app (e.g. directly in SQL) can't crash the map render.
- [Card gets visually crowded with three new optional rows] → Mitigated by rendering them as a compact inline icon row, only for the fields actually present; not a blocker for this change, but worth a visual check during implementation.

## Migration Plan

1. New Supabase migration: `alter table profiles add column contact_email text, add column social_links jsonb not null default '[]'::jsonb;` (both additive, non-breaking, no backfill needed).
2. `bun run db:types` to regenerate `database.types.ts` against the new columns.
3. Ship frontend changes (types, validators, settings form, map card/select list) in the same change.
4. Rollback: drop the two columns in a follow-up migration if needed; no data-loss risk since this is new, additive data with no dependents.

## Open Questions

- Exact platform list for v1 (twitter/instagram/telegram/mastodon/facebook proposed) — confirm during implementation if any should be swapped for one more relevant to the Esperanto community (e.g. Discord).
