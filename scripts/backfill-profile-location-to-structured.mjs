import { createClient } from '@supabase/supabase-js'
import { City, Country, State } from 'country-state-city'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dryRun = process.argv.includes('--write') ? false : true
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1] ?? '0', 10) : null

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run with e.g. SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/backfill-profile-location-to-structured.mjs')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function splitLocation(value) {
  return value
    .split(/[,\-\/|]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function buildCountryIndex() {
  const index = new Map()
  for (const country of Country.getAllCountries()) {
    const aliases = unique([
      country.name,
      country.isoCode,
      country.phonecode ? `+${country.phonecode}` : '',
    ])
    for (const alias of aliases) {
      index.set(normalize(alias), country)
    }
  }
  index.set('usa', Country.getAllCountries().find((country) => country.isoCode === 'US'))
  index.set('united states', Country.getAllCountries().find((country) => country.isoCode === 'US'))
  index.set('uk', Country.getAllCountries().find((country) => country.isoCode === 'GB'))
  index.set('united kingdom', Country.getAllCountries().find((country) => country.isoCode === 'GB'))
  index.set('mexico', Country.getAllCountries().find((country) => country.isoCode === 'MX'))
  return index
}

const countryIndex = buildCountryIndex()

function findCountry(token) {
  return countryIndex.get(normalize(token)) ?? null
}

function findState(countryIso, token) {
  const normalized = normalize(token)
  return State.getStatesOfCountry(countryIso).find((state) => {
    return normalize(state.name) === normalized || normalize(state.isoCode) === normalized
  }) ?? null
}

function findCity(countryIso, token, stateIso = null) {
  const normalized = normalize(token)
  const pool = stateIso
    ? City.getCitiesOfState(countryIso, stateIso)
    : City.getCitiesOfCountry(countryIso)

  const matches = pool.filter((city) => normalize(city.name) === normalized)
  return matches.length === 1 ? matches[0] : null
}

function inferStructuredLocation(rawLocation, current) {
  const location = String(rawLocation ?? '').trim()
  if (!location) {
    return { status: 'skip', reason: 'empty_location' }
  }

  if (current.country || current.region || current.city) {
    return { status: 'skip', reason: 'structured_fields_already_present' }
  }

  const tokens = splitLocation(location)
  if (tokens.length === 0) {
    return { status: 'skip', reason: 'no_tokens' }
  }

  if (tokens.length >= 2) {
    const country = findCountry(tokens[tokens.length - 1])
    if (country) {
      if (tokens.length >= 3) {
        const cityToken = tokens[0]
        const regionToken = tokens[1]
        const state = findState(country.isoCode, regionToken)
        if (state) {
          const city = findCity(country.isoCode, cityToken, state.isoCode)
          return {
            status: city ? 'matched' : 'partial',
            reason: city ? 'city_region_country' : 'region_country_only',
            country: country.name,
            region: state.name,
            city: city?.name ?? null,
          }
        }
      }

      const middleToken = tokens[0]
      const state = findState(country.isoCode, middleToken)
      if (state) {
        return {
          status: 'matched',
          reason: 'region_country',
          country: country.name,
          region: state.name,
          city: null,
        }
      }

      const city = findCity(country.isoCode, middleToken)
      if (city) {
        const stateFromCity = city.stateCode ? State.getStateByCodeAndCountry(city.stateCode, country.isoCode) : null
        return {
          status: 'matched',
          reason: 'city_country',
          country: country.name,
          region: stateFromCity?.name ?? null,
          city: city.name,
        }
      }

      return {
        status: 'partial',
        reason: 'country_only',
        country: country.name,
        region: null,
        city: null,
      }
    }
  }

  const singleCountry = findCountry(tokens[0])
  if (singleCountry) {
    return {
      status: 'matched',
      reason: 'single_country',
      country: singleCountry.name,
      region: null,
      city: null,
    }
  }

  return { status: 'unresolved', reason: 'ambiguous_or_unknown', tokens }
}

function printSummary(summary) {
  console.log('\nBackfill summary')
  console.log(`mode: ${dryRun ? 'dry-run' : 'write'}`)
  console.log(`total scanned: ${summary.total}`)
  console.log(`matched: ${summary.matched}`)
  console.log(`partial: ${summary.partial}`)
  console.log(`skipped: ${summary.skipped}`)
  console.log(`unresolved: ${summary.unresolved}`)
}

async function main() {
  let query = supabase
    .from('profiles')
    .select('id, username, location, country, region, city')
    .not('location', 'is', null)

  if (limit && Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error

  const profiles = data ?? []
  const summary = {
    total: profiles.length,
    matched: 0,
    partial: 0,
    skipped: 0,
    unresolved: 0,
  }

  const updates = []
  const unresolved = []

  for (const profile of profiles) {
    const inferred = inferStructuredLocation(profile.location, profile)

    if (inferred.status === 'matched') {
      summary.matched += 1
      updates.push({
        id: profile.id,
        username: profile.username,
        country: inferred.country ?? null,
        region: inferred.region ?? null,
        city: inferred.city ?? null,
        reason: inferred.reason,
      })
      continue
    }

    if (inferred.status === 'partial') {
      summary.partial += 1
      updates.push({
        id: profile.id,
        username: profile.username,
        country: inferred.country ?? null,
        region: inferred.region ?? null,
        city: inferred.city ?? null,
        reason: inferred.reason,
      })
      continue
    }

    if (inferred.status === 'skip') {
      summary.skipped += 1
      continue
    }

    summary.unresolved += 1
    unresolved.push({
      id: profile.id,
      username: profile.username,
      location: profile.location,
      reason: inferred.reason,
    })
  }

  printSummary(summary)

  if (updates.length > 0) {
    console.log('\nCandidates to update:')
    console.table(updates.slice(0, 25))
  }

  if (unresolved.length > 0) {
    console.log('\nUnresolved examples:')
    console.table(unresolved.slice(0, 25))
  }

  if (dryRun) return

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        country: update.country,
        region: update.region,
        city: update.city,
      })
      .eq('id', update.id)

    if (updateError) {
      console.error(`Failed to update profile ${update.username} (${update.id})`, updateError)
    }
  }

  console.log(`\nApplied ${updates.length} profile updates.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
