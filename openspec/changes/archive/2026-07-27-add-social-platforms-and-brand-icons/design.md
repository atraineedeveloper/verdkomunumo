## Context

`src/lib/constants.ts` currently defines `SOCIAL_PLATFORM_META: Record<SocialPlatform, {label: string; emoji: string}>` for 5 platforms (twitter, instagram, telegram, mastodon, facebook), consumed by two places: `SocialLinksEditor.tsx` (a native `<select><option>{emoji} {label}</option></select>` per row) and `SamideanojPage.tsx`'s `UserCard` (an `<a>{emoji}</a>` per link, plus a bare 🔗/✉️ for website/contact email). `simple-icons` (already installed during research for this change) exports each brand as a named object `{title, hex, path, ...}` — `siX`, `siInstagram`, `siTelegram`, `siMastodon`, `siFacebook`, `siWhatsapp`, `siThreads`, `siDuolingo` cover exactly the 8 platforms this change needs (Twitter/X was renamed `siX` in the package, our internal key stays `'twitter'` for backward compatibility with already-saved `social_links` data).

## Goals / Non-Goals

**Goals:**
- Real, recognizable brand SVG icons (in brand color) wherever a social link is actually *shown to other members* — the map card is the highest-value target since that's the actual point of contact.
- Website and contact-email icons become real icons too (`lucide-react`, already a dependency, no new import cost) instead of 🔗/✉️.
- Add duolingo/threads/whatsapp as selectable platforms end to end (type, validation, settings picker, map display).

**Non-Goals:**
- Not replacing the native `<select>` in `SocialLinksEditor.tsx` with a custom listbox/combobox component. A native `<option>` element cannot render an embedded `<svg>` — only text content — so a truly icon-rich *dropdown* would require building a custom accessible listbox, which is a disproportionate amount of new UI/accessibility work for a settings-form platform picker. See Decisions below for the compromise.
- Not adding per-platform icons to `SocialLinksEditor`'s `<option>` text (dropping the emoji-in-option hack entirely, not replacing it with anything equivalent inside the `<option>`).

## Decisions

**Native `<select>` stays text-only; add a live icon preview next to it instead of inside it.** Since `<option>` can't embed SVG, the picker itself shows plain platform names ("X / Twitter", "Instagram", "Duolingo", ...). A small `BrandIcon` renders just to the left of the `<select>`, reflecting whichever platform is currently chosen for that row, updating on change — the user still sees a real brand mark associated with their selection, just not baked into the dropdown's own rendering.

**New `src/components/ui/BrandIcon.tsx`, same shape as the existing `LocaleFlag.tsx`.** Takes a `simple-icons` `SimpleIcon` object and renders `<svg role="img" viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} fill={`#${icon.hex}`} /></svg>` sized via a `className`/`size` prop. Consistent with the existing pattern of a tiny dedicated icon component per icon *system* in this codebase (flags vs. brand marks are different concerns, kept separate).

**Website and contact-email icons switch to `lucide-react`'s `Globe` and `Mail`.** Both already ship with the existing `lucide-react` dependency (used in `Navbar.tsx`, `ToastViewport.tsx`, `src/lib/icons.ts`) — zero new cost, and matches the rest of the app's generic-UI-icon language, reserving brand-colored `simple-icons` marks specifically for third-party platforms.

**`SOCIAL_LINKS_MAX` goes from 5 to 8**, matching the platform count 1:1 (a member could in principle add one link per platform, same ratio as the original 5-platforms/5-max design). Reconsider only if the settings-form UI feels cluttered at 8 rows during implementation — not a hard requirement either way.

**Icons render in brand color (`#${hex}`), not a neutral/theme color.** This is the actual value of switching away from emoji — recognizable, correctly-colored logos. Accepted trade-off: brand colors don't shift with the app's `green`/`dark`/`vivid`/`minimal` theme, same as how flag icons already don't theme-shift.

## Risks / Trade-offs

- [`simple-icons` is a fairly large package on disk (thousands of brand icons)] → Mitigated by named ESM imports (`import {siX} from 'simple-icons'`) plus Vite's tree-shaking, which the package's own README recommends; only the 8 icons actually imported end up in the bundle, not the full library. Worth confirming with a build-size check during implementation (`bun run build` chunk output).
- [Brand-colored icons on a dark background theme could have contrast/legibility issues for some brands] → Low risk given icon size is small and decorative (`aria-hidden`, the platform name is always available via the row's own label/tooltip); not blocking, worth an eyeball check during implementation across themes.
- [`twitter` internal key vs. `siX` brand rename] → No user-facing inconsistency: the stored `platform: 'twitter'` value and its Zod enum entry are unchanged; only the icon/label displayed for it updates to reflect the current "X" branding.

## Migration Plan

1. `SOCIAL_PLATFORMS`/`SOCIAL_PLATFORM_META`/`SOCIAL_LINKS_MAX` update in `constants.ts` (already-saved `social_links` rows with the 5 original platform values remain valid — no data migration, this is purely additive to the enum).
2. New `BrandIcon.tsx` component.
3. Update `SocialLinksEditor.tsx` and `SamideanojPage.tsx` to consume it.
4. No Supabase migration — `social_links` is `jsonb`, already accepts any platform string the app-level Zod schema allows; only the TypeScript/Zod enum widens.
