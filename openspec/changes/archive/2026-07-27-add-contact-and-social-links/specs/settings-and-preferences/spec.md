## MODIFIED Requirements

### Requirement: Profile Settings Explicit Save
The system SHALL require an explicit save action for profile field changes (username, display name, bio, website, contact email, social links, location fields), validating username format, length, and uniqueness, contact email format, and each social link's URL before saving, and SHALL show success or error feedback after the attempt.

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
