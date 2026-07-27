import { SOCIAL_LINKS_MAX, SOCIAL_PLATFORMS, SOCIAL_PLATFORM_META } from '@/lib/constants'
import { BrandIcon } from '@/components/ui/BrandIcon'
import type { SocialLink } from '@/lib/types'

interface SocialLinksEditorProps {
  links: SocialLink[]
  onChange: (updater: (current: SocialLink[]) => SocialLink[]) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function SocialLinksEditor({ links, onChange, t }: SocialLinksEditorProps) {
  return (
    <div className="field">
      <span className="field-label">{t('settings_social_links')}</span>
      <span className="field-hint">{t('settings_social_links_hint')}</span>
      {links.map((link, index) => (
        <div className="social-link-row" key={index}>
          <BrandIcon icon={SOCIAL_PLATFORM_META[link.platform].icon} className="social-platform-preview" />
          <select
            name="social_platform"
            value={link.platform}
            onChange={(event) => onChange((current) => current.map((item, itemIndex) =>
              itemIndex === index ? { ...item, platform: event.target.value as SocialLink['platform'] } : item
            ))}
          >
            {SOCIAL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {SOCIAL_PLATFORM_META[platform].label}
              </option>
            ))}
          </select>
          <input
            name="social_url"
            type="url"
            placeholder="https://"
            value={link.url}
            onChange={(event) => onChange((current) => current.map((item, itemIndex) =>
              itemIndex === index ? { ...item, url: event.target.value } : item
            ))}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onChange((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          >
            {t('settings_social_link_remove')}
          </button>
        </div>
      ))}
      {links.length < SOCIAL_LINKS_MAX && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onChange((current) => [...current, { platform: SOCIAL_PLATFORMS[0], url: '' }])}
        >
          {t('settings_social_link_add')}
        </button>
      )}
    </div>
  )
}
