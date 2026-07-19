import { describe, expect, it } from "vitest"
import type { FundingEventSummary } from "@/lib/domain"
import { getMapCoverage } from "@/lib/map-coverage"

function event(overrides: Partial<FundingEventSummary>): FundingEventSummary {
  return {
    id: "event-1",
    headline: "Funding event",
    funderName: "Funder",
    recipientName: null,
    amountLabel: null,
    countryCode: null,
    countryName: null,
    sectorName: null,
    status: "committed",
    reportedAt: "Date not reported",
    locationPrecision: "unknown",
    coordinates: null,
    source: { publisher: "IATI", url: "https://example.org/source" },
    ...overrides
  }
}

describe("getMapCoverage", () => {
  it("separates exact, country-level, and unlocated records", () => {
    const coverage = getMapCoverage([
      event({ id: "exact", countryCode: "KE", coordinates: { latitude: -1.28, longitude: 36.82 } }),
      event({ id: "kenya-1", countryCode: "KE", countryName: "Kenya", locationPrecision: "country" }),
      event({ id: "kenya-2", countryCode: "KE", countryName: "Kenya", locationPrecision: "country" }),
      event({ id: "brazil", countryCode: "BR", countryName: "Brazil", locationPrecision: "country" }),
      event({ id: "unknown" })
    ])

    expect(coverage.exactEvents.map(({ id }) => id)).toEqual(["exact"])
    expect(coverage.countries).toEqual([
      { code: "BR", name: "Brazil", eventCount: 1 },
      { code: "KE", name: "Kenya", eventCount: 2 }
    ])
    expect(coverage.countryLevelEventCount).toBe(3)
    expect(coverage.unlocatedEventCount).toBe(1)
  })
})
