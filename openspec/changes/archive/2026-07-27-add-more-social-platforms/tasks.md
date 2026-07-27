## 1. Platforms

- [x] 1.1 Add `discord | line | matrix | patreon | reddit | weibo | tumblr | tiktok | youtube | vk | wechat` to `SocialPlatform` in `src/lib/types.ts`
- [x] 1.2 Add the 11 platforms to `SOCIAL_PLATFORMS` and `SOCIAL_PLATFORM_META` in `src/lib/constants.ts`, importing `siDiscord, siLine, siMatrix, siPatreon, siReddit, siSinaweibo, siTumblr, siTiktok, siYoutube, siVk, siWechat` from `simple-icons`
- [x] 1.3 Bump `SOCIAL_LINKS_MAX` from 8 to 19

## 2. Verification

- [x] 2.1 `bun run typecheck`, `bun run build`, `bun run guard:quality`, `bun run test`
- [x] 2.2 `openspec validate add-more-social-platforms --strict` before archiving
