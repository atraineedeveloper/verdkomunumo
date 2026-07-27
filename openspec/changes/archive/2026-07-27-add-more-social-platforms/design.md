## Context

This directly extends the pattern established in the prior `add-social-platforms-and-brand-icons` change: `SOCIAL_PLATFORM_META` maps each `SocialPlatform` to a `{label, icon}` pair, where `icon` is a named `simple-icons` export. `SocialLinksEditor.tsx`, `SamideanojPage.tsx`, and `socialLinksSchema` all already derive their platform list from `SOCIAL_PLATFORMS` dynamically — no UI or validation code needs to change, only the data.

## Goals / Non-Goals

**Goals:** Add the 11 confirmed platforms with real brand icons; keep `SOCIAL_LINKS_MAX` at a 1:1 ratio with the platform count.

**Non-Goals:** Not adding Skype (no icon available in the installed `simple-icons` version — Microsoft retired the product in 2025). Not changing the editor UI, validation, or map-card rendering — all already generic.

## Decisions

**`weibo` as the internal key (not `sinaweibo`), mapped to the `siSinaweibo` icon export.** Matches the platform's common short name; the icon library's export name doesn't have to match the internal enum value (same as `twitter` internally mapping to the `siX` icon already).

**`SOCIAL_LINKS_MAX` bumped to 19** (8 existing + 11 new), continuing the 1:1-with-platform-count rule from the prior change rather than picking an arbitrary smaller cap.

## Risks / Trade-offs

- [19 platform options makes the `<select>` long] → Native `<select>` scales fine to this length; not a real usability blocker, and no smaller curated subset was requested.

## Migration Plan

Data-only change to `src/lib/constants.ts`/`types.ts`; no migration, no deploy risk beyond normal frontend deploy.
