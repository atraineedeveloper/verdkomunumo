/**
 * Temporary fallback for Esperanto country labels.
 *
 * The previous bulk import introduced corrupted text. Until a verified
 * translation table is restored, the app falls back to English names so the
 * location selector stays usable and encoding-safe.
 */
export const COUNTRY_NAMES_EO: Record<string, string> = {}

export function toEsperantoCountryName(englishName: string): string {
  return COUNTRY_NAMES_EO[englishName] ?? englishName
}
