import { describe, expect, it } from 'vitest'
import { buildEmailSettingsUrl, EMAIL_NOTIFICATION_FIELDS, isEmailPreferenceEnabled } from '@/lib/emailPreferences'

describe('emailPreferences', () => {
  it('builds a deep link to settings for a notification type', () => {
    expect(buildEmailSettingsUrl('https://verdkomunumo.world/', { type: 'mention', unsubscribe: true })).toBe(
      'https://verdkomunumo.world/agordoj?email=mention&unsubscribe=1#email-preferences',
    )
  })

  it('maps notification types to preference fields', () => {
    expect(EMAIL_NOTIFICATION_FIELDS.comment).toBe('email_notify_comment')
    expect(EMAIL_NOTIFICATION_FIELDS.category_rejected).toBe('email_notify_category_rejected')
  })

  it('respects the master switch before the per-type switch', () => {
    expect(
      isEmailPreferenceEnabled(
        {
          email_notifications_enabled: false,
          email_notify_comment: true,
        },
        'comment',
      ),
    ).toBe(false)
  })

  it('respects the specific switch when the master switch is enabled', () => {
    expect(
      isEmailPreferenceEnabled(
        {
          email_notifications_enabled: true,
          email_notify_mention: false,
        },
        'mention',
      ),
    ).toBe(false)
  })
})
