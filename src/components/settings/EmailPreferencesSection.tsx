import { EMAIL_NOTIFICATION_OPTIONS } from '@/lib/emailPreferences'
import type { SettingsForm } from '@/lib/settingsProfile'

interface EmailPreferencesSectionProps {
  emailLinkIntent: boolean
  form: SettingsForm
  highlightedEmailType: string | null
  isPending: boolean
  onFormChange: (updater: (current: SettingsForm) => SettingsForm) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function EmailPreferencesSection({
  emailLinkIntent,
  form,
  highlightedEmailType,
  isPending,
  onFormChange,
  onSubmit,
  t,
}: EmailPreferencesSectionProps) {
  return (
    <section className="section" id="email-preferences">
      <h2 className="section-title">{t('settings_email')}</h2>
      <p className="section-copy">{t('settings_email_help')}</p>
      {emailLinkIntent && highlightedEmailType ? (
        <div className="section-note">{t('settings_email_link_notice')}</div>
      ) : null}
      <form onSubmit={onSubmit}>
        <div className="toggle-list">
          <label className="toggle-row toggle-row-master">
            <div>
              <span className="toggle-kicker">{t('settings_email_master_kicker')}</span>
              <span className="toggle-title">{t('settings_email_enabled')}</span>
              <span className="toggle-sub">{t('settings_email_enabled_hint')}</span>
            </div>
            <input
              name="email_notifications_enabled"
              type="checkbox"
              checked={form.email_notifications_enabled}
              onChange={(event) => onFormChange((current) => ({ ...current, email_notifications_enabled: event.target.checked }))}
            />
          </label>

          {EMAIL_NOTIFICATION_OPTIONS.map((option) => (
            <label
              key={option.type}
              className={`toggle-row ${highlightedEmailType === option.type ? 'toggle-row-highlight' : ''} ${!form.email_notifications_enabled ? 'toggle-row-disabled' : ''}`}
            >
              <div>
                {highlightedEmailType === option.type ? (
                  <span className="toggle-kicker">{t('settings_email_link_kicker')}</span>
                ) : null}
                <span className="toggle-title">{t(option.titleKey as never, { defaultValue: option.defaultTitle })}</span>
                <span className="toggle-sub">{t(option.hintKey as never, { defaultValue: option.defaultHint })}</span>
              </div>
              <input
                name={option.field}
                type="checkbox"
                checked={form[option.field]}
                disabled={!form.email_notifications_enabled}
                onChange={(event) => onFormChange((current) => ({ ...current, [option.field]: event.target.checked }))}
              />
            </label>
          ))}
        </div>

        <button className="btn-primary" type="submit" disabled={isPending}>
          {isPending ? t('settings_saving') : t('settings_save')}
        </button>
      </form>
    </section>
  )
}
