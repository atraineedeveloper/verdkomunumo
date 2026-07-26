# Admin Moderation

## Purpose

Admin and moderation tools are high-impact, high-risk surfaces. They must gate access by role, offer clear moderation actions, and give admins reliable visibility into reported content.

## Requirements

### Requirement: Role-Based Route Gating
The system SHALL gate admin and moderation routes by a minimum required role (moderator, admin, or owner) read from the signed-in user's profile, redirecting to the feed when the requirement is not met.

#### Scenario: Moderator attempts an admin-only page
- GIVEN a user with the moderator role
- WHEN they navigate to an admin-only route (e.g. category management)
- THEN they are redirected to the feed

### Requirement: Content Hide And Restore
The system SHALL let staff soft-delete (hide) a reported or otherwise problematic post or comment, and SHALL let staff restore a previously hidden post or comment.

#### Scenario: Hiding a reported comment
- GIVEN a comment referenced by a pending report
- WHEN a staff member hides it
- THEN the comment is marked hidden and no longer appears in normal browsing

### Requirement: Report Review And Resolution
The system SHALL surface pending content reports to staff with the reported content and reporter context, let staff hide the content or dismiss the report, and SHALL record who resolved the report, when, and with what outcome.

#### Scenario: Dismissing a report
- GIVEN a pending report that staff judge to be unfounded
- WHEN a staff member dismisses it
- THEN the report is marked dismissed with the resolving staff member and timestamp recorded, and the content remains visible

### Requirement: Owner-Only Role Assignment
The system SHALL restrict changing another user's role to users with the owner role in the admin UI. This is currently enforced only at the client; no database-level policy has been confirmed to allow a staff member to update another user's `profiles` row, which is a known gap to close in a dedicated change before relying on this control.

#### Scenario: Admin (not owner) attempts a role change
- GIVEN a staff member with the admin role, not owner
- WHEN they view the role-management control for another user
- THEN the control is not available to them in the admin UI

### Requirement: Partial Audit Trail
The system SHALL record the resolving staff member and timestamp when a content report or product suggestion is resolved. The system currently does NOT record who performed a hide/restore action or a role change, or when — this absence of a general audit trail is a known gap for future work.

#### Scenario: Hiding a post leaves no actor record
- GIVEN a staff member hides a post directly from the admin dashboard (not via report resolution)
- WHEN the action completes
- THEN the post is marked hidden but no record of which staff member performed the action, or when, is stored anywhere
