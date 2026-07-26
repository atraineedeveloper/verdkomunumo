# Messages And Notifications

## Purpose

Private messages and notifications are retention-critical: conversation discovery, unread counts, and notification-to-target navigation must stay accurate and trustworthy.

## Requirements

### Requirement: Conversation List Ordering And Preview
The system SHALL list a user's conversations ordered by most recent activity first, showing a truncated preview of the last message, and SHALL show an empty state with a call to action when the user has no conversations.

#### Scenario: No conversations yet
- GIVEN a user with no conversations
- WHEN they open the messages list
- THEN an empty state with a "start a conversation" action is shown instead of a list

### Requirement: Message Sending With Optimistic Feedback
The system SHALL block sending an empty message, SHALL optimistically append a sent message to the conversation before the request completes, and SHALL roll back the optimistic message and preserve the user's typed text for retry if sending fails.

#### Scenario: Send fails
- GIVEN a user sends a message and the request fails
- WHEN the failure is detected
- THEN the optimistic message is removed from the thread, an error is shown, and the user's typed text remains in the input for retry

### Requirement: Unread Message And Notification Counts
The system SHALL compute per-conversation and global unread message counts by comparing message timestamps against the user's last-read marker, and SHALL compute unread notification counts from notifications not yet marked read, refreshing on relevant navigation, invalidation, and realtime notification inserts.

#### Scenario: New notification arrives while online
- GIVEN a user has the app open
- WHEN a new notification is inserted for them
- THEN the notification badge count updates via the realtime subscription without requiring a manual refresh

### Requirement: Notification Feed
The system SHALL list a user's notifications most-recent-first across supported types (like, comment, follow, message, mention, category approved/rejected), collapsing consecutive unread message-type notifications from the same sender into one entry, and SHALL let the user mark all notifications as read at once.

#### Scenario: Multiple unread messages from the same sender
- GIVEN several unread message-type notifications from the same sender
- WHEN the notification list renders
- THEN only one unread entry for that sender is shown

### Requirement: Notification-To-Target Navigation
The system SHALL navigate to the relevant profile, post, or conversation when a notification with a resolvable target is opened, and SHALL mark message-type notifications read as a side effect of visiting the related conversation, while non-message notification types are not marked read by click-through alone.

#### Scenario: Opening a like notification
- GIVEN a notification about a like on the user's post
- WHEN the user opens it
- THEN they are navigated to that post, and the notification itself remains unread unless "mark all read" is used afterward
