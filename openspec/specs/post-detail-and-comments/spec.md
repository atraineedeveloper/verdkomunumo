# Post Detail And Comments

## Purpose

The post detail route is a deep-linkable content page supporting threaded comments, edits, deletes, reports, and liker inspection for both the post and individual comments, independently of the feed's own cache.

## Requirements

### Requirement: Post Detail Deep Linking And Caching
The system SHALL load a single post by id on its own route and cache key, independent from the feed's cache, and SHALL invalidate both the post-detail and feed caches together whenever a like, comment, or edit mutation affects that post.

#### Scenario: Editing from detail reflects in feed
- GIVEN a post open on its detail route
- WHEN the post or one of its comments is mutated (liked, commented on, edited)
- THEN both the post-detail cache and the feed cache are invalidated so the change is visible in either view

### Requirement: Post Not Found Handling
The system SHALL show a translated "post not found" message with a link back to the feed when the requested post does not exist or fails to load.

#### Scenario: Deleted or invalid post id
- GIVEN a post id that does not resolve to an existing, non-deleted post
- WHEN the detail route is opened
- THEN the not-found message and feed link are shown instead of post content

### Requirement: Threaded Comments
The system SHALL nest replies under their parent comment based on the reply relationship, and SHALL treat a comment whose parent cannot be resolved as a top-level comment rather than failing to render.

#### Scenario: Orphaned reply
- GIVEN a comment whose recorded parent comment cannot be found
- WHEN the comment thread is built
- THEN that comment is shown as a top-level comment instead of being dropped

### Requirement: Comment Editing
The system SHALL allow a user to edit only their own comments, within the maximum comment length, and SHALL only enable saving when the trimmed content has actually changed and is non-empty.

#### Scenario: Editing another user's comment
- GIVEN a comment authored by a different user
- WHEN the current user views that comment
- THEN no edit control is available to them

#### Scenario: No-op edit
- GIVEN a user opens their own comment for editing without changing the text
- WHEN they view the save control
- THEN saving remains disabled until the content actually changes

### Requirement: Comment Deletion
The system SHALL require the deleting user to own the comment, SHALL require explicit confirmation before deleting, and SHALL permanently remove the comment record on confirmation.

#### Scenario: Deleting own comment
- GIVEN a user viewing their own comment
- WHEN they choose to delete it and confirm the prompt
- THEN the comment is permanently removed and disappears from the thread

### Requirement: Comment Reporting
The system SHALL allow any user to report any comment with a selected reason and optional details, independent of comment ownership.

#### Scenario: Reporting another user's comment
- GIVEN a comment authored by someone else
- WHEN the current user submits a report with a reason
- THEN the report is recorded and a confirmation is shown

### Requirement: Liker List On Post And Comments
The system SHALL provide the same liker-list summary/dialog behavior for both the main post and individual comments on the detail route, using independent state and cache entries per target so that opening one target's liker list does not affect another target's reply, edit, delete, or report state.

#### Scenario: Viewing comment likers mid-reply
- GIVEN a user has an active reply or edit open on one comment
- WHEN they open the liker list on a different comment
- THEN the reply/edit state on the first comment is unaffected
