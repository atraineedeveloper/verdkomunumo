## 1. Icons And Constants

- [x] 1.1 Add `src/components/ui/BrandIcon.tsx` rendering a `simple-icons` `SimpleIcon` as an inline SVG in brand color
- [x] 1.2 Update `src/lib/constants.ts`: `SOCIAL_PLATFORM_META` maps each platform to `{label, icon}` using `siX, siInstagram, siTelegram, siMastodon, siFacebook, siWhatsapp, siThreads, siDuolingo`; add `duolingo`, `threads`, `whatsapp` to `SOCIAL_PLATFORMS`; bump `SOCIAL_LINKS_MAX` to 8
- [x] 1.3 Add `'duolingo' | 'threads' | 'whatsapp'` to the `SocialPlatform` union in `src/lib/types.ts`

## 2. UI

- [x] 2.1 `SocialLinksEditor.tsx`: replace `{emoji} {label}` option text with plain `{label}`; add a `BrandIcon` preview next to the `<select>` reflecting the row's current platform
- [x] 2.2 `SamideanojPage.tsx`'s `UserCard`: replace 🔗/✉️ with `lucide-react`'s `Globe`/`Mail`, and each social link's emoji with `BrandIcon`

## 3. Verification

- [x] 3.1 `bun run typecheck`, `bun run build`, `bun run guard:quality`, `bun run test`
- [x] 3.2 Check the build output chunk size for the icon-bearing pages to confirm `simple-icons` tree-shaking is working (no full-library bundle)
- [x] 3.3 `openspec validate add-social-platforms-and-brand-icons --strict` before archiving
