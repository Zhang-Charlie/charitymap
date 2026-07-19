import type { FundingEventSummary } from "@/lib/domain"

export type CountryCoverage = {
  code: string
  name: string
  eventCount: number
}

export type MapCoverage = {
  exactEvents: FundingEventSummary[]
  countries: CountryCoverage[]
  countryLevelEventCount: number
  unlocatedEventCount: number
}

export function getMapCoverage(events: FundingEventSummary[]): MapCoverage {
  const exactEvents: FundingEventSummary[] = []
  const countries = new Map<string, CountryCoverage>()
  let countryLevelEventCount = 0
  let unlocatedEventCount = 0

  events.forEach((event) => {
    if (event.coordinates) {
      exactEvents.push(event)
      return
    }

    if (event.countryCode) {
      const existing = countries.get(event.countryCode)
      countries.set(event.countryCode, {
        code: event.countryCode,
        name: existing?.name ?? event.countryName ?? event.countryCode,
        eventCount: (existing?.eventCount ?? 0) + 1
      })
      countryLevelEventCount += 1
      return
    }

    unlocatedEventCount += 1
  })

  return {
    exactEvents,
    countries: Array.from(countries.values()).sort((left, right) => left.name.localeCompare(right.name)),
    countryLevelEventCount,
    unlocatedEventCount
  }
}
