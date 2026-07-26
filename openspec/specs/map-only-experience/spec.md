# Map-only experience

## Purpose

Verdkomunumo provides an authenticated map where members who opt in can find
other members by approximate structured location.

## Requirements

### Requirement: The map is the product home

The system SHALL require authentication for the product and SHALL render the
user map at the root route after authentication.

#### Scenario: Authenticated member opens the application

- WHEN an authenticated member opens the root route
- THEN the user map is displayed

#### Scenario: Guest opens the application

- WHEN a guest opens a protected product route
- THEN the guest is redirected to login with the original destination preserved

### Requirement: Product navigation is map-only

The system SHALL expose only the map and profile settings in authenticated
product navigation. It SHALL NOT expose feeds, posts, categories, messaging,
community chat, notifications, member search, public profiles, or moderation
dashboards.

#### Scenario: Member uses the primary navigation

- WHEN an authenticated member views the primary navigation
- THEN only map, profile settings, appearance control, and logout actions are available

### Requirement: Members retain profile configuration

The system SHALL preserve the profile settings needed to manage member identity,
location, map visibility, appearance, and account preferences.

#### Scenario: Member changes map visibility

- WHEN a member saves a valid structured location and enables map visibility
- THEN their geocoded location becomes eligible to appear on the map
