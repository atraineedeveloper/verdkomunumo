## Context

Screenshots of the live app (via Playwright + the existing E2E auth-override mechanism) confirmed two real bugs, not just taste: the social-link editor row (icon + `<select>` + `<input>` + remove button, added in a prior change) stacks vertically instead of forming a row, because the global `input,textarea,select { width: 100% }` rule in `settingsStyles.ts` overrides flex sizing whenever those elements are direct flex children without a sizing override; and the `Lando`/`Regiono`/`Urbo` three-column row has no responsive breakpoint, so `Urbo` visibly clips on a 390px viewport.

`profiles_select`'s RLS is `USING (auth.uid() = id OR map_visible = true)` (fixed earlier this session) — row-level only. Once a row is readable, every column on it is readable via the Supabase REST API, regardless of what the app's own UI chooses to render. That's fine for bio/website/social links (meant to become public once opted into the map) but wrong for sex/birth_date, which the user wants genuinely private.

## Goals / Non-Goals

**Goals:**
- Real row layout for social links (icon + select + url + remove all in one row, sane wrap on narrow screens).
- No more clipped `Urbo` field on mobile.
- Settings visually organized into clear sub-groups without restructuring the save flow.
- `sex`/`birth_date` genuinely unreadable by anyone but the owner, at the RLS layer — not just hidden in the UI.

**Non-Goals:**
- Not building column-level privacy inside the `profiles` table itself (Postgres RLS is row-scoped; a column-level `REVOKE` would have to apply to the whole `authenticated` role, which would also block the owner from reading their own value through a normal table grant — not fixable without a second table or a view/RPC layer, and a new table is simpler here).
- Not re-validating sex/birth_date beyond what the native `<select>`/`<input type="date">` already constrain — no age-minimum policy, no future-date rejection; out of scope unless asked.
- Not restructuring `profiles`' own RLS/columns — untouched.

## Decisions

**New table `profile_private_details`, not new columns on `profiles`.** RLS: `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)` for select/insert/update — no `map_visible` clause at all, so unlike everything else on the map card, this data has zero public read path, direct-API included. `id` is both PK and FK to `profiles(id) ON DELETE CASCADE`, one row per user, created on first save (no `handle_new_user` trigger needed — the row simply doesn't exist until the user fills in one of these optional fields, and every query already treats "no row" the same as "both fields empty").

**Fetch via PostgREST embedding, not a second round-trip.** `supabase.from('profiles').select('*, profile_private_details(sex, birth_date)')` — Supabase/PostgREST resolves the FK automatically for a single query. Since `profile_private_details_select_own` only ever allows the caller's own row, this embed naturally returns `null`/empty for the field when the row doesn't exist yet or (impossible in practice, since it's always the owner asking) isn't visible.

**Save via upsert, not update.** `buildProfilePayload`'s caller does two writes in the same mutation: the existing `profiles` update, plus `supabase.from('profile_private_details').upsert({id: user.id, sex, birth_date})` — upsert handles both "first time filling this in" (insert) and "editing later" (update) without branching logic.

**Row layout fix: give the select/input explicit `flex`/`width: auto` inside a dedicated `.social-link-row` class**, instead of continuing to rely on `.field-row` (which is intentionally full-width-per-child for the avatar/country-region-city use cases). Mobile: `flex-wrap: wrap` lets the URL input drop to its own line under icon+select if needed, rather than clipping or forcing a fixed too-narrow width.

**Country/Region/City: stack on narrow viewports via a new `@media (max-width: 520px)` rule** turning `.field-row` into `flex-direction: column` — the simplest fix that doesn't touch the desktop 3-column layout at all, and this is the first `@media` rule `settingsStyles.ts` has needed.

**Sub-sections via headings inside the existing single `.section` card, not separate cards.** Keeps the single `<form onSubmit>`/single save button/single mutation entirely unchanged — purely a visual `<h3 class="subsection-title">` + a light top border between groups (Identity, Location & map, Contact & social). Splitting into separate cards would imply separate save actions, which isn't what was asked for and would be a bigger behavioral change.

## Risks / Trade-offs

- [A user fills in sex/birth_date, then the app briefly shows stale data if the embed and the base profile fall out of sync] → Not a real risk here: both are read in the same query (single embedded select) and written in the same mutation (`Promise.all` on both writes before the mutation resolves), so there's no window where the UI could observe inconsistent state.
- [New table adds a join to every profile read] → Negligible: single-row PK lookup, only on the Settings page's own profile load — the map's `fetchMapUsers` never touches this table.

## Migration Plan

1. New migration creates `profile_private_details` + RLS policies (additive, no existing data affected).
2. `bun run db:types` to pick up the new table.
3. Frontend: types, fetch/save logic, form UI, layout fixes, i18n — same change.
4. Rollback: drop the table; no data loss risk beyond the (new, optional, never-before-existing) sex/birth_date values themselves.
