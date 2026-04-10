# Comment Replies

## Title

Replies to post comments with one nesting level.

## Summary

Users need to respond directly to comments on a post without turning the full thread into a flat list. The goal is to support simple threaded conversations while keeping the first version small, predictable, and easy to moderate.

## Scope

### In

- Replying to an existing root comment on a post.
- Rendering replies nested under their parent comment.
- Reusing the main comment composer for replies.
- Storing replies through `comments.parent_id`.
- Keeping optimistic updates correct for create, edit, like, and delete.
- Notifying the parent comment author when a reply is created.

### Out

- Infinite-depth threads.
- Inline reply composers per comment.
- A new `reply` notification type.
- Special ranking or collapsing for long threads.
- Cross-post replies or quote-style comment threading.

## User Experience

- On the post detail page, each root comment shows a `Reply` action for authenticated users.
- When the user taps `Reply`, the main comment composer switches into reply mode.
- Reply mode shows who is being replied to and exposes a cancel action.
- Submitting in reply mode creates a child comment under the selected parent.
- Replies are visually indented under the parent comment.
- The post comment count continues to reflect total comments plus replies.

## Business Rules

- A root comment has `parent_id = null`.
- A reply has `parent_id = <root comment id>`.
- Replies may only target comments from the same post.
- Version 1 allows only one reply level.
- A reply cannot target another reply.
- Deleting a root comment removes its replies through the existing cascade behavior.
- The post author should still be notified of new comments when applicable.
- The parent comment author should be notified of a reply when they are not the actor and not already the same recipient as the post author notification.

## Data And Contracts

- Table: `comments`
  - uses existing `parent_id uuid null`
- Frontend type: `Comment`
  - `parent_id?: string | null`
  - `replies?: Comment[]`
- View contract for post detail:
  - `data.comments` contains only root comments
  - replies live in `comment.replies`
- Ordering:
  - root comments sorted by `created_at asc`
  - replies sorted by `created_at asc`
- Validation:
  - `content` uses the existing comment schema
  - `parent_id` is optional and nullable
- Database integrity:
  - index on `comments.parent_id`
  - reject reply if parent belongs to another `post_id`
  - reject reply if parent already has its own `parent_id`

## Error Cases

- If the selected parent comment no longer exists, the insert must fail and the UI must recover from optimistic state.
- If the user loses auth during reply, submission must fail like a normal comment submission.
- If the backend rejects a second-level reply, the client should show the returned error and keep the composer usable.
- If a root comment is deleted while a reply is being composed, the next submit must fail cleanly instead of attaching the reply to nowhere.
- If a notification would target the same user twice, only one notification row should be kept.

## Acceptance Criteria

- Given a post with root comments, when an authenticated user clicks `Reply` on one of them, then the main composer enters reply mode and shows the target user.
- Given reply mode is active, when the user cancels, then the composer returns to root-comment mode.
- Given reply mode is active, when the user submits, then the new comment is created with `parent_id` set to the selected root comment id.
- Given a post detail response with flat comments, when the page normalizes the data, then only root comments remain at the top level and replies are attached under the correct parent.
- Given a reply exists, when a user likes or edits it, then optimistic UI behaves the same as for root comments.
- Given a root comment with replies, when it is deleted, then the full subtree disappears from local UI and the total count is updated.
- Given a reply targets a comment from another post, when the insert reaches the database, then the database rejects it.
- Given a reply targets another reply, when the insert reaches the database, then the database rejects it.
- Given a user replies to somebody else’s comment, when the insert succeeds, then the parent comment author receives a `comment` notification unless they already match another recipient rule.

## Verification

- Unit:
  - flat comment list transforms into the correct tree
  - ordering stays stable for roots and replies
- Integration:
  - optimistic create, edit, like, and delete work on replies
  - total comment count updates for roots and replies
- E2E:
  - user can enter reply mode, cancel, and publish a reply
- A11y:
  - reply action remains keyboard reachable and properly labeled
- Visual:
  - reply indentation and composer state do not break mobile or desktop layout
- DB / migration:
  - parent/post consistency enforced
  - one-level reply restriction enforced
  - parent-author notification behavior verified

## Notes

- This is intentionally an MVP. If threads become active, future work can add reply collapsing, deeper nesting, or a dedicated reply notification type.
- The main composer is reused on purpose to avoid duplicating mutation state across many comment rows.
