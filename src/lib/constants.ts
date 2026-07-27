import { siX, siInstagram, siTelegram, siMastodon, siFacebook, siWhatsapp, siThreads, siDuolingo } from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'
import type { EsperantoLevel, SocialPlatform } from './types'

export const ESPERANTO_LEVELS: Record<EsperantoLevel, { label: string; emoji: string }> = {
  komencanto: { label: 'Komencanto', emoji: '🌱' },
  progresanto: { label: 'Progresanto', emoji: '🌿' },
  flua: { label: 'Flua', emoji: '🌳' }
}

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  'twitter',
  'instagram',
  'telegram',
  'mastodon',
  'facebook',
  'duolingo',
  'threads',
  'whatsapp'
] as const

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, { label: string; icon: SimpleIcon }> = {
  twitter: { label: 'X / Twitter', icon: siX },
  instagram: { label: 'Instagram', icon: siInstagram },
  telegram: { label: 'Telegram', icon: siTelegram },
  mastodon: { label: 'Mastodon', icon: siMastodon },
  facebook: { label: 'Facebook', icon: siFacebook },
  duolingo: { label: 'Duolingo', icon: siDuolingo },
  threads: { label: 'Threads', icon: siThreads },
  whatsapp: { label: 'WhatsApp', icon: siWhatsapp }
}

export const SOCIAL_LINKS_MAX = 8

export const CATEGORIES = [
  { name: 'Ĝenerala', slug: 'generala', icon: '💬' },
  { name: 'Lernado', slug: 'lernado', icon: '📚' },
  { name: 'Kulturo', slug: 'kulturo', icon: '🎭' },
  { name: 'Novaĵoj', slug: 'novajoj', icon: '📰' },
  { name: 'Teknologio', slug: 'teknologio', icon: '💻' },
  { name: 'Vojaĝoj', slug: 'vojagoj', icon: '✈️' },
  { name: 'Helpo', slug: 'helpo', icon: '🤝' },
  { name: 'Ludoj', slug: 'ludoj', icon: '🎮' }
] as const

export const POST_MAX_LENGTH = 5000
export const COMMENT_MAX_LENGTH = 2000
export const MESSAGE_MAX_LENGTH = 5000
export const POST_MAX_IMAGES = 4
export const FEED_PAGE_SIZE = 20

export const X_SYSTEM_MAP: Record<string, string> = {
  cx: 'ĉ', gx: 'ĝ', hx: 'ĥ', jx: 'ĵ', sx: 'ŝ', ux: 'ŭ',
  Cx: 'Ĉ', Gx: 'Ĝ', Hx: 'Ĥ', Jx: 'Ĵ', Sx: 'Ŝ', Ux: 'Ŭ'
}

export const SUPERSIGNOJ = ['ĉ', 'ĝ', 'ĥ', 'ĵ', 'ŝ', 'ŭ', 'Ĉ', 'Ĝ', 'Ĥ', 'Ĵ', 'Ŝ', 'Ŭ']

export const APP_NAME = 'Verdkomunumo'
export const APP_TAGLINE = 'La verda komunumo de Esperantujo'
