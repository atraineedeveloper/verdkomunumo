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

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const json = await res.json()
    if (json.status !== 'success') return null
    return {
      url: json.data.url ?? url,
      title: json.data.title ?? undefined,
      description: json.data.description ?? undefined,
      image: json.data.image?.url ?? undefined,
    }
  } catch {
    return null
  }
}
