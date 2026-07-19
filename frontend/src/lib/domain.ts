export type FundingStatus =
  | "announced"
  | "committed"
  | "disbursed"
  | "reported_spend"
  | "cancelled"
  | "unknown"

export type LocationPrecision =
  | "exact"
  | "city"
  | "region"
  | "country"
  | "unknown"

export type FundingEventSummary = {
  id: string
  headline: string
  funderName: string
  recipientName: string | null
  amountLabel: string | null
  countryName: string | null
  sectorName: string | null
  status: FundingStatus
  reportedAt: string
  locationPrecision: LocationPrecision
  coordinates: {
    latitude: number
    longitude: number
  } | null
  source: {
    publisher: string
    url: string
  }
}

export type FundingDataState = "ready" | "unconfigured" | "unavailable"
