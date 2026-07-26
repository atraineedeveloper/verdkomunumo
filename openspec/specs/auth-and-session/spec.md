# Auth And Session

## Purpose

Authentication and session continuity are foundational to Verdkomunumo. Users must be able to sign in with an email or username, register, use Google OAuth, and reset a forgotten password, while the app preserves authenticated UI continuity across refreshes and token-refresh events without guest/auth flicker.

## Requirements

### Requirement: Identifier Login
The system SHALL allow sign-in with either an email address or a username, routing email-shaped input through direct password sign-in and non-email input through an identifier-lookup path, and SHALL present a single generic error message for any credential failure rather than distinguishing wrong-password from unknown-user.

#### Scenario: Login with username
- GIVEN a registered user whose input is not email-shaped
- WHEN they submit their username and password
- THEN the system resolves the identifier to an account and signs them in without revealing whether the failure (if any) was due to a bad username or a bad password

#### Scenario: Invalid credentials
- GIVEN any login attempt with incorrect credentials
- WHEN the submission fails
- THEN the system shows the same generic invalid-credentials message regardless of the underlying cause

### Requirement: Post-Login Redirect Safety
The system SHALL redirect a successfully authenticated user to the `next` path carried on the login URL, falling back to the feed when `next` is absent or unsafe (protocol-relative, backslash-prefixed, or cross-origin).

#### Scenario: Safe next redirect
- GIVEN a user was redirected to login from a protected route with `?next=/some/internal/path`
- WHEN login succeeds
- THEN the system navigates to `/some/internal/path`

#### Scenario: Unsafe next redirect
- GIVEN a login URL carries a `next` value pointing to an external or protocol-relative address
- WHEN login succeeds
- THEN the system ignores that value and navigates to the feed instead

### Requirement: Registration Validation
The system SHALL require a valid email, a password of at least 8 characters, and a username of 3-30 lowercase alphanumeric/underscore characters before creating an account, and SHALL reject registration if the username is already taken.

#### Scenario: Username already taken
- GIVEN a username that already exists on another profile
- WHEN a user attempts to register with that username
- THEN registration is blocked with a "username already in use" error before any account is created

### Requirement: Google OAuth Sign-In
The system SHALL offer Google as a sign-in option only when the Google auth feature flag is enabled, and SHALL complete the flow via a callback route that exchanges the returned code for a session.

#### Scenario: OAuth callback failure
- GIVEN a user completes the Google consent screen
- WHEN the code-for-session exchange at the auth callback route fails
- THEN the user is redirected to the login page with an auth-callback-failed error shown

### Requirement: Password Reset Without Account Enumeration
The system SHALL show the same "if an account exists" confirmation message after a password-reset request regardless of whether the submitted email belongs to a real account.

#### Scenario: Reset requested for unknown email
- GIVEN an email address with no matching account
- WHEN a password reset is requested for it
- THEN the system shows the same generic confirmation as it would for a known account

### Requirement: Password Reset Completion
The system SHALL only render the new-password form once the reset session is confirmed ready (via code exchange or a password-recovery auth event), and SHALL sign the user out after a successful password update.

#### Scenario: Completing a reset
- GIVEN a user follows a valid password-reset link
- WHEN they submit a new password
- THEN the password is updated, the session is signed out, and the user is returned to the login page

### Requirement: Session Continuity Across Token Refresh
The system SHALL preserve the current user's profile state across `TOKEN_REFRESHED`, `USER_UPDATED`, and same-user `SIGNED_IN`/`INITIAL_SESSION` auth events, without clearing or flickering the profile.

#### Scenario: Token silently refreshes
- GIVEN an authenticated user with a loaded profile
- WHEN the underlying auth token refreshes in the background
- THEN the profile and authenticated UI state remain unchanged and no guest state is shown at any point

### Requirement: Protected Route Access
The system SHALL show a loading state (not a guest flicker) while session initialization is pending, redirect unauthenticated users to login with a `next` parameter capturing their intended destination, and redirect users lacking a required minimum role back to the feed.

#### Scenario: Unauthenticated user hits a protected route
- GIVEN a signed-out visitor
- WHEN they navigate directly to a protected route
- THEN they are redirected to login with `next` set to that route, and after successful login are returned to it

#### Scenario: Insufficient role
- GIVEN an authenticated user whose role is below a route's required minimum role
- WHEN they navigate to that route
- THEN they are redirected to the feed

### Requirement: Sign Out
The system SHALL clear both the Supabase session and local auth/profile state on sign-out and navigate the user to the login page.

#### Scenario: Manual sign out
- GIVEN an authenticated user
- WHEN they choose to sign out
- THEN their session and local profile state are cleared and they land on the login page
