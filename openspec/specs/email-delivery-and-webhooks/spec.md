# Email Delivery And Webhooks

## Purpose

Email delivery supports account and product communication. It runs through a queued, idempotent Supabase edge function pipeline that respects per-user preferences, separate from Supabase Auth's own built-in account emails.

## Requirements

### Requirement: Triggered Notification Email Types
The system SHALL queue an email delivery for exactly three notification types today — a comment on the user's post, a new direct message, and an @mention in a post or comment. Likes, follows, and category-approval/rejection notifications SHALL NOT queue an email today even though their preference toggles and edge-function handling exist, because no database trigger inserts a notification for those event types yet.

#### Scenario: Someone likes a user's post
- GIVEN a user receives a like on their post
- WHEN the like is recorded
- THEN no email delivery is queued for it, regardless of the user's like-email preference setting

#### Scenario: Someone comments on a user's post
- GIVEN a user receives a comment on their post
- WHEN the comment is recorded
- THEN an email delivery is queued for that notification

### Requirement: Idempotent Delivery Claiming
The system SHALL claim a queued email delivery (transitioning it from queued to processing) before sending, and SHALL treat a delivery already claimed as already-processed rather than sending a duplicate email if the webhook fires more than once for the same row.

#### Scenario: Duplicate webhook delivery
- GIVEN a delivery row that has already been claimed and processed
- WHEN the same webhook event is delivered again
- THEN the function reports it as already processed and does not send a second email

### Requirement: Recipient Preference Enforcement
The system SHALL skip sending an email, marking the delivery skipped, when the recipient has disabled the master email-notifications switch or the specific per-type preference for that notification.

#### Scenario: Recipient disabled that notification type
- GIVEN a recipient who has turned off email notifications for mentions
- WHEN a mention email delivery is processed for them
- THEN it is marked skipped and no email is sent

### Requirement: Provider Failure Handling
The system SHALL mark a delivery as failed with the provider's error detail when the email provider request does not succeed, and SHALL NOT automatically retry a failed delivery.

#### Scenario: Provider request fails
- GIVEN a queued delivery ready to send
- WHEN the email provider returns a failure response
- THEN the delivery is marked failed with the provider's error message and no automatic retry occurs

### Requirement: Auth Account Emails Are Out Of This Pipeline
The system SHALL send password-reset and signup-confirmation emails through Supabase Auth's own built-in email delivery, not through the notification-email-delivery pipeline described above.

#### Scenario: Password reset email
- GIVEN a user requests a password reset
- WHEN the email is sent
- THEN it goes out through Supabase Auth's built-in delivery, not through `notification_email_deliveries` or the `send-notification-email` function

### Requirement: One-Directional Delivery Only
The system SHALL only send outbound email through the provider and record the provider's synchronous response (sent/failed); it SHALL NOT receive or process inbound provider webhooks for bounce, complaint, or delivery-status events today.

#### Scenario: Recipient's email bounces at the provider
- GIVEN an email that was marked sent after a successful provider response
- WHEN the message actually bounces at the recipient's mail server
- THEN the system has no way to learn about or record that bounce, since no inbound webhook exists for it
