# Profiles And Search

## Purpose

Profiles and search support discovery across people and content, remaining browsable without authentication where intended, while auth-gating the actions that require an identity.

## Requirements

### Requirement: Public Profile Viewing
The system SHALL allow any visitor, authenticated or not, to view a user's profile page, including their recent posts, follower/following counts, and structured location (country/region/city), without requiring login.

#### Scenario: Guest views a profile
- GIVEN a signed-out visitor
- WHEN they open a user's profile URL
- THEN the profile, its recent posts, and public counts render without prompting for login

### Requirement: Auth-Gated Profile Actions
The system SHALL only offer "Message" and "Follow" actions on another user's profile to an authenticated visitor, and SHALL show a login call-to-action in their place for a guest.

#### Scenario: Guest viewing another user's profile
- GIVEN a signed-out visitor viewing someone else's profile
- WHEN the action area renders
- THEN a login call-to-action is shown instead of Message/Follow buttons

### Requirement: Profile Empty Posts State
The system SHALL show a dedicated empty-state message on a profile with no posts, distinct from the loading state.

#### Scenario: Profile with no posts
- GIVEN a user profile that has never posted
- WHEN the profile page finishes loading
- THEN an empty-posts message is shown instead of a blank list

### Requirement: User And Content Search
The system SHALL search users by username or display name and posts by content or author once the query is at least two characters, showing a hint instead of running a query for shorter input, and SHALL show a distinct empty-results message per tab when a search yields nothing.

#### Scenario: Query too short
- GIVEN a search query under two characters
- WHEN the user types it
- THEN no search request is made and a search hint is shown instead

#### Scenario: No results
- GIVEN a search query of two or more characters that matches nothing
- WHEN results load
- THEN an empty-results message is shown for that tab
