import { toEsperantoCountryName } from '@/lib/country-names-eo'

export interface LocationOption {
  label: string
  value: string
}

type CountryStateCityModule = typeof import('country-state-city')

let countryStateCityModulePromise: Promise<CountryStateCityModule> | null = null

async function loadCountryStateCity() {
  if (!countryStateCityModulePromise) {
    countryStateCityModulePromise = import('country-state-city')
  }

  return countryStateCityModulePromise
}

export async function getAllCountries(locale?: string): Promise<LocationOption[]> {
  const { Country } = await loadCountryStateCity()
  const useEsperanto = locale === 'eo'

  return Country.getAllCountries()
    .map((country) => ({
      label: useEsperanto ? toEsperantoCountryName(country.name) : country.name,
      value: country.name,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export async function countryNameToIso(name: string): Promise<string | null> {
  const { Country } = await loadCountryStateCity()
  const match = Country.getAllCountries().find((country) => country.name === name)
  return match?.isoCode ?? null
}

export async function getStatesOfCountry(countryIso: string): Promise<Array<LocationOption & { isoCode: string }>> {
  const { State } = await loadCountryStateCity()

  return State.getStatesOfCountry(countryIso)
    .map((state) => ({ label: state.name, value: state.name, isoCode: state.isoCode }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export async function stateNameToIso(countryIso: string, name: string): Promise<string | null> {
  const { State } = await loadCountryStateCity()
  const match = State.getStatesOfCountry(countryIso).find((state) => state.name === name)
  return match?.isoCode ?? null
}

export async function getCitiesOfState(countryIso: string, stateIso: string): Promise<LocationOption[]> {
  const { City } = await loadCountryStateCity()

  return City.getCitiesOfState(countryIso, stateIso)
    .map((city) => ({ label: city.name, value: city.name }))
    .sort((left, right) => left.label.localeCompare(right.label))
}
