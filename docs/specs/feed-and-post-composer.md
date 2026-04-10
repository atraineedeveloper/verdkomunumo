# Feed And Post Composer

## Summary

This flow covers the public feed, guest state, authenticated composer, quoted posts, post media, likes, edit/delete, and optimistic refresh behavior. The goal is to make the feed reliable as the primary landing surface for the product.

## Current Status

- The guest feed surface is already covered with functional and visual checks.
- Authenticated composer, ownership actions, and richer post interactions are still partial and need the next stabilization pass.

## Scope

### In

- feed loading for guest and authenticated users
- composer visibility and submission path
- guest CTA behavior
- likes, quotes, edit, delete, media rendering
- empty, loading, and error states

### Out

- ranking redesign
- moderation policy changes
- deep composer drafting features

## User Experience

- the feed loads without layout jumps or broken placeholders
- guests can browse and are guided toward login/register
- authenticated users can compose and interact with their posts reliably
- loading and refresh states are visible but not disruptive

## Business Rules

- guest users cannot post or like
- only owners can edit or delete their own posts
- optimistic updates must reconcile correctly after refetch
- quote flow must preserve the selected post until cleared or submitted

## Data And Contracts

- feed data comes from the existing post fetch fallback flow
- optimistic helpers remain the frontend contract for in-place updates
- composer validation continues to use existing schemas

## Error And Edge Cases

- empty following feed
- failed feed fetch
- optimistic like/edit/delete rollback
- stale quoted post reference
- media and link preview rendering with partial data

## Acceptance Criteria

- guest feed states render correctly and stay visually stable
- authenticated composer and richer post interactions still need the remaining pass
- composer actions do not leave stale local state
- like, edit, delete, and quote interactions recover from failure
- feed mobile layout remains stable

## Verification

- Unit: optimistic helpers, post parsing, validation
- E2E: guest CTA, composer, like, edit/delete own post, quote path
- A11y: feed route and major interactive controls
- Visual: feed guest state and authenticated composer state

## Notes

- Feed stability matters because it is both a first impression surface and a dependency for other navigations.
