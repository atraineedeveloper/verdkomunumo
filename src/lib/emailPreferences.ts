import { routes } from '@/lib/routes'
import type { NotificationType, Profile } from '@/lib/types'

export type EmailPreferenceField =
  | 'email_notifications_enabled'
  | 'email_notify_like'
  | 'email_notify_comment'
  | 'email_notify_follow'
  | 'email_notify_message'
  | 'email_notify_mention'
  | 'email_notify_category_approved'
  | 'email_notify_category_rejected'

export const EMAIL_NOTIFICATION_FIELDS: Record<NotificationType, EmailPreferenceField> = {
  like: 'email_notify_like',
  comment: 'email_notify_comment',
  follow: 'email_notify_follow',
  message: 'email_notify_message',
  mention: 'email_notify_mention',
  category_approved: 'email_notify_category_approved',
  category_rejected: 'email_notify_category_rejected',
}

export const EMAIL_NOTIFICATION_OPTIONS: Array<{
  type: NotificationType
  field: EmailPreferenceField
  titleKey: string
  hintKey: string
  defaultTitle: string
  defaultHint: string
}> = [
  {
    type: 'like',
    field: 'email_notify_like',
    titleKey: 'settings_email_like',
    hintKey: 'settings_email_like_hint',
    defaultTitle: 'Ŝatoj ĉe viaj afiŝoj',
    defaultHint: 'Sendi retmesaĝon kiam iu ŝatis vian afiŝon.',
  },
  {
    type: 'comment',
    field: 'email_notify_comment',
    titleKey: 'settings_email_comment',
    hintKey: 'settings_email_comment_hint',
    defaultTitle: 'Novaj komentoj',
    defaultHint: 'Sendi retmesaĝon kiam iu komentis vian afiŝon.',
  },
  {
    type: 'follow',
    field: 'email_notify_follow',
    titleKey: 'settings_email_follow',
    hintKey: 'settings_email_follow_hint',
    defaultTitle: 'Novaj sekvantoj',
    defaultHint: 'Sendi retmesaĝon kiam iu komencis sekvi vin.',
  },
  {
    type: 'message',
    field: 'email_notify_message',
    titleKey: 'settings_email_message',
    hintKey: 'settings_email_message_hint',
    defaultTitle: 'Novaj mesaĝoj',
    defaultHint: 'Sendi retmesaĝon kiam iu sendis al vi novan mesaĝon.',
  },
  {
    type: 'mention',
    field: 'email_notify_mention',
    titleKey: 'settings_email_mention',
    hintKey: 'settings_email_mention_hint',
    defaultTitle: 'Mencioj',
    defaultHint: 'Sendi retmesaĝon kiam iu menciis vin en afiŝo.',
  },
  {
    type: 'category_approved',
    field: 'email_notify_category_approved',
    titleKey: 'settings_email_category_approved',
    hintKey: 'settings_email_category_approved_hint',
    defaultTitle: 'Aprobitaj proponoj',
    defaultHint: 'Sendi retmesaĝon kiam via kategorio-propono estis aprobita.',
  },
  {
    type: 'category_rejected',
    field: 'email_notify_category_rejected',
    titleKey: 'settings_email_category_rejected',
    hintKey: 'settings_email_category_rejected_hint',
    defaultTitle: 'Malakceptitaj proponoj',
    defaultHint: 'Sendi retmesaĝon kiam via kategorio-propono estis malakceptita.',
  },
]

export function isKnownNotificationType(value: string | null): value is NotificationType {
  return EMAIL_NOTIFICATION_OPTIONS.some((option) => option.type === value)
}

export function isEmailPreferenceEnabled(
  profile: Pick<Profile, 'email_notifications_enabled'> & Partial<Record<EmailPreferenceField, boolean>>,
  type: NotificationType,
) {
  if (profile.email_notifications_enabled === false) return false
  const field = EMAIL_NOTIFICATION_FIELDS[type]
  return profile[field] !== false
}

export function buildEmailSettingsUrl(
  baseUrl: string,
  options?: { type?: NotificationType; unsubscribe?: boolean },
) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const url = new URL(routes.settings, `${normalizedBaseUrl}/`)
  if (options?.type) {
    url.searchParams.set('email', options.type)
  }
  if (options?.unsubscribe) {
    url.searchParams.set('unsubscribe', '1')
  }
  url.hash = 'email-preferences'
  return url.toString()
}
