export type FundingStatus =
  | "announced"
  | "committed"
  | "partially_disbursed"
  | "fully_disbursed"
  | "reported_expenditure"
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
}
