# Post Detail And Comments

## Summary

This flow covers opening a post, reading its full content, threaded comments, replies, likes, edit/delete actions, and comment counts. The goal is to make the conversation view reliable and internally consistent.

## Scope

### In

- post detail loading and rendering
- root comments and one-level replies
- comment create/edit/delete/like
- optimistic state and refetch reconciliation
- comment totals and thread ordering

### Out

- deeper nesting
- thread collapsing and ranking
- separate reply notification type

## User Experience

- post detail opens reliably from feed, profile, or search
- comments render in chronological and threaded order
- reply mode is clear and cancelable
- editing and deleting comments produce immediate but recoverable UI feedback

## Business Rules

- total comment count includes roots and replies
- replies are limited to one level
- parent-child integrity must match database constraints
- only owners may edit/delete their comments

## Data And Contracts

- comments are normalized into roots plus `replies`
- optimistic helpers must support nested comment updates
- comment validation uses the existing schema and `parent_id`

## Error And Edge Cases

- missing or deleted parent comment
- stale optimistic state after failure
- post detail opened with partial data from another route
- parent/child race conditions during delete or reply

## Acceptance Criteria

- post detail loads consistently from every public entry point
- comment actions remain consistent after refetch
- reply flow is stable in desktop and mobile
- thread UI does not regress counts or ordering

## Verification

- Unit: comment normalization and optimistic comment helpers
- E2E: open post, comment, reply, edit, delete
- A11y: post detail route and comment controls
- Visual: thread rendering and reply composer state

## Notes

- This spec intentionally assumes the current MVP reply model already implemented in code.
