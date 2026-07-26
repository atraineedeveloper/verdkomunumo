# Suggestions And Feedback

## Purpose

The suggestion flow lets authenticated users submit product ideas and lets staff triage them, staying lightweight for submitters and manageable for reviewers.

## Requirements

### Requirement: Authenticated Suggestion Submission
The system SHALL only allow authenticated users to submit a suggestion, validating a required title and description within defined length limits and an optional context field, and SHALL show explicit loading, success, and error feedback for the submission.

#### Scenario: Signed-out visitor
- GIVEN a signed-out visitor
- WHEN the app renders
- THEN no suggestion submission control is available to them

### Requirement: Suggestion Status Lifecycle
The system SHALL create every new suggestion with `pending` status, and SHALL allow staff to transition a pending suggestion to exactly one of `planned` or `closed`, after which no further status transition is available.

#### Scenario: Suggestion already actioned
- GIVEN a suggestion whose status is already `planned` or `closed`
- WHEN a staff member views it
- THEN no further status-change action is offered for it

### Requirement: Staff-Only Suggestion Review
The system SHALL restrict suggestion status changes to users with at least the moderator role, recording the reviewing staff member and the review timestamp on the suggestion when its status changes.

#### Scenario: Regular user attempts to change a suggestion's status
- GIVEN a signed-in user without moderator, admin, or owner role
- WHEN they view a suggestion in any surface available to them
- THEN no status-change action is offered to them

### Requirement: No Submitter Notification On Status Change
The system SHALL NOT send the submitting user any notification when their suggestion's status changes; the submitter can only see the updated status by revisiting their own submission through means available to them today.

#### Scenario: Suggestion is marked planned
- GIVEN a user's suggestion is moved from pending to planned by staff
- WHEN the status changes
- THEN the submitter receives no notification of any kind about the change
