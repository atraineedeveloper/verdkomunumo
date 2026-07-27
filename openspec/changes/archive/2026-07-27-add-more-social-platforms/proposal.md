## Why

The user pointed at miavivo.net (an Esperanto community site) as a reference for which social platforms members expect to link. Comparing its list against the current 8 platforms (twitter, instagram, telegram, mastodon, facebook, duolingo, threads, whatsapp), 12 are missing; 11 of those have a `simple-icons` brand icon available (Skype does not — Microsoft discontinued it in 2025 and the icon library dropped it).

## What Changes

- Add `discord`, `line`, `matrix`, `patreon`, `reddit`, `weibo`, `tumblr`, `tiktok`, `youtube`, `vk`, `wechat` to `SocialPlatform`/`SOCIAL_PLATFORMS`/`SOCIAL_PLATFORM_META` (via `siDiscord`, `siLine`, `siMatrix`, `siPatreon`, `siReddit`, `siSinaweibo`, `siTumblr`, `siTiktok`, `siYoutube`, `siVk`, `siWechat`).
- Bump `SOCIAL_LINKS_MAX` from 8 to 19 (one per platform), matching the established 1:1 ratio decision from the prior platforms change.
- Skype is explicitly NOT added (no icon available); flagged to the user rather than silently dropped or faked with a generic icon.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `settings-and-preferences`: "Profile Settings Explicit Save" requirement's platform list grows from 8 to 19 named platforms.

## Impact

- `src/lib/types.ts` (`SocialPlatform` union), `src/lib/constants.ts` (`SOCIAL_PLATFORMS`, `SOCIAL_PLATFORM_META`, `SOCIAL_LINKS_MAX`).
- No other code changes: `SocialLinksEditor.tsx`, `SamideanojPage.tsx`, `validators.ts`'s `socialLinksSchema` all already derive from `SOCIAL_PLATFORMS`/`SOCIAL_PLATFORM_META` dynamically (established in the prior platforms change).
- No database change — `social_links` is `jsonb`, already accepts any platform string the app's Zod enum allows.
