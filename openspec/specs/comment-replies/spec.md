# Comment Replies

## Purpose

Comment replies let users respond to a specific comment within a post's thread, keeping the reply target explicit and the top-level composer out of the way while a reply is in progress.

## Requirements

### Requirement: Reply Target Selection
The system SHALL let a user select a specific comment as a reply target, rendering the reply composer directly under that comment rather than at the top of the thread, and SHALL disable the top-level composer while a reply target is active.

#### Scenario: Starting a reply
- GIVEN a user chooses to reply to a specific comment
- WHEN the reply target is set
- THEN a composer appears under that comment and the top-level comment composer becomes disabled

### Requirement: Reply Cancellation
The system SHALL clear the reply target and any drafted reply content when the user cancels a reply, restoring the top-level composer.

#### Scenario: Cancelling a reply
- GIVEN a user has an open reply composer with drafted text
- WHEN they cancel the reply
- THEN the drafted text is discarded, the reply target is cleared, and the top-level composer becomes available again

### Requirement: Nested Reply Rendering
The system SHALL render replies nested under their parent comment recursively, and SHALL show a "replying to" preview only for a reply that itself targets another reply (not for a top-level comment's direct replies).

#### Scenario: Reply to a reply
- GIVEN a reply that itself replies to another reply
- WHEN the thread renders
- THEN a small preview naming the comment it replies to is shown above it
