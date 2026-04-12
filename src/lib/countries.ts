import { City, Country, State } from 'country-state-city'
import { toEsperantoCountryName } from '@/lib/country-names-eo'

/**
 * Location helpers built on top of `country-state-city`.
 *
 * All three levels (country -> state -> city) use official English names so
 * that they can be passed directly to Nominatim for geocoding.
 */
export interface LocationOption {
  label: string
  value: string
}

export function getAllCountries(locale?: string): LocationOption[] {
  const useEsperanto = locale === 'eo'

  return Country.getAllCountries()
    .map((country) => ({
      label: useEsperanto ? toEsperantoCountryName(country.name) : country.name,
      value: country.name,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function countryNameToIso(name: string): string | null {
  const match = Country.getAllCountries().find((country) => country.name === name)
  return match?.isoCode ?? null
}

export function getStatesOfCountry(countryIso: string): Array<LocationOption & { isoCode: string }> {
  return State.getStatesOfCountry(countryIso)
    .map((state) => ({ label: state.name, value: state.name, isoCode: state.isoCode }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function stateNameToIso(countryIso: string, name: string): string | null {
  const match = State.getStatesOfCountry(countryIso).find((state) => state.name === name)
  return match?.isoCode ?? null
}

export function getCitiesOfState(countryIso: string, stateIso: string): LocationOption[] {
  return City.getCitiesOfState(countryIso, stateIso)
    .map((city) => ({ label: city.name, value: city.name }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export const COUNTRIES: string[] = Country.getAllCountries()
  .map((country) => country.name)
  .sort((left, right) => left.localeCompare(right))
