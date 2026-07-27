## MODIFIED Requirements

### Requirement: Profile Settings Explicit Save
The system SHALL require an explicit save action for profile field changes (username, display name, bio, website, contact email, social links, sex, birth date, location fields), validating username format, length, and uniqueness, contact email format, and each social link's URL before saving, and SHALL show success or error feedback after the attempt. The selectable social platforms SHALL include twitter, instagram, telegram, mastodon, facebook, duolingo, threads, whatsapp, discord, line, matrix, patreon, reddit, weibo, tumblr, tiktok, youtube, vk, and wechat. Sex, when set, SHALL be restricted to male or female. Sex and birth date SHALL be optional and SHALL NOT be readable by any user other than the profile's owner, regardless of that profile's map visibility.

#### Scenario: Username already taken by another account
- GIVEN a user changes their username to one already used by another profile
- WHEN they save
- THEN the save is rejected with a "username already in use" error and no change is persisted

#### Scenario: Invalid contact email
- GIVEN a user enters a value in the contact email field that is not a valid email address
- WHEN they attempt to save
- THEN the save is rejected with a validation error and no change is persisted

#### Scenario: Invalid social link URL
- GIVEN a user adds a social link with a non-URL value
- WHEN they attempt to save
- THEN the save is rejected with a validation error identifying that link and no change is persisted

#### Scenario: Saving with contact and social fields empty
- GIVEN a user leaves contact email and all social links blank
- WHEN they save other profile fields
- THEN the save succeeds and those fields remain unset

#### Scenario: Selecting a newly added platform
- GIVEN a user adding a social link
- WHEN they open the platform selector
- THEN discord, line, matrix, patreon, reddit, weibo, tumblr, tiktok, youtube, vk, and wechat are available alongside the original eight platforms

#### Scenario: Saving sex and birth date
- GIVEN a user sets their sex and birth date in profile settings
- WHEN they save
- THEN both values are persisted and visible to them on their next visit, but leaving either blank saves successfully with that field unset

#### Scenario: Sex and birth date stay private even when map-visible
- GIVEN a member who has enabled map visibility and set a sex and birth date
- WHEN another user (or an unauthenticated request) queries that member's data by any means, including direct API access
- THEN sex and birth date are never returned, unlike the member's other opted-in public fields
