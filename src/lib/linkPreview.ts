export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi

export function extractFirstUrl(text: string): string | null {
  URL_REGEX.lastIndex = 0
  const match = URL_REGEX.exec(text)
  return match ? match[0] : null
}

export function sanitizeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

export function sanitizeLinkPreview(preview: LinkPreview | null | undefined): LinkPreview | null {
  if (!preview) return null
  const safeUrl = sanitizeHttpUrl(preview.url)
  if (!safeUrl) return null
  const safeImage = sanitizeHttpUrl(preview.image)

  return {
    ...preview,
    url: safeUrl,
    image: safeImage ?? undefined,
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const json = await res.json()
    if (json.status !== 'success') return null
    return sanitizeLinkPreview({
      url: json.data.url ?? url,
      title: json.data.title ?? undefined,
      description: json.data.description ?? undefined,
      image: json.data.image?.url ?? undefined,
    })
  } catch {
    return null
  }
}
