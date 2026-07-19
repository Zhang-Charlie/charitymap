import { createClient } from "@supabase/supabase-js"
import type { FundingDataState, FundingEventSummary, FundingStatus, LocationPrecision } from "@/lib/domain"

type PublicFundingEventRow = {
  id: string
  headline: string
  funder_name: string
  recipient_name: string | null
  original_amount: number | string | null
  original_currency: string | null
  status: string
  event_date: string | null
  source_published_at: string | null
  sector_code: string | null
  location_name: string | null
  country_code: string | null
  location_precision: string | null
  latitude: number | string | null
  longitude: number | string | null
  source_publisher: string
  source_url: string
}

export type PublicFundingEventsResult = {
  events: FundingEventSummary[]
  state: FundingDataState
  message: string | null
}

const fundingStatuses: ReadonlySet<string> = new Set([
  "announced",
  "committed",
  "disbursed",
  "reported_spend",
  "cancelled",
  "unknown"
])

const locationPrecisions: ReadonlySet<string> = new Set([
  "exact",
  "city",
  "region",
  "country",
  "unknown"
])

export async function getPublicFundingEvents(): Promise<PublicFundingEventsResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonymousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonymousKey) {
    return {
      events: [],
      state: "unconfigured",
      message: "Public funding data has not been configured for this environment."
    }
  }

  try {
    const supabase = createClient(url, anonymousKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    const { data, error } = await supabase
      .from("approved_funding_event_summaries")
      .select("*")
      .order("source_published_at", { ascending: false, nullsFirst: false })
      .limit(100)

    if (error) {
      return {
        events: [],
        state: "unavailable",
        message: "Approved funding records could not be loaded right now."
      }
    }

    const rows = Array.isArray(data) ? data : []
    return {
      events: rows.map(toFundingEventSummary),
      state: "ready",
      message: null
    }
  } catch {
    return {
      events: [],
      state: "unavailable",
      message: "Approved funding records could not be loaded right now."
    }
  }
}

function toFundingEventSummary(value: unknown): FundingEventSummary {
  const row = value as PublicFundingEventRow
  const countryCode = normalizeCountryCode(row.country_code)
  const countryName = row.location_name ?? countryNameFromCode(countryCode)
  const latitude = numberOrNull(row.latitude)
  const longitude = numberOrNull(row.longitude)

  return {
    id: row.id,
    headline: row.headline,
    funderName: row.funder_name,
    recipientName: row.recipient_name,
    amountLabel: formatAmount(row.original_amount, row.original_currency),
    countryCode,
    countryName,
    sectorName: row.sector_code,
    status: fundingStatuses.has(row.status) ? (row.status as FundingStatus) : "unknown",
    reportedAt: formatDate(row.source_published_at ?? row.event_date),
    locationPrecision: locationPrecisions.has(row.location_precision ?? "")
      ? (row.location_precision as LocationPrecision)
      : "unknown",
    coordinates:
      latitude !== null && longitude !== null && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
        ? { latitude, longitude }
        : null,
    source: {
      publisher: row.source_publisher,
      url: row.source_url
    }
  }
}

function normalizeCountryCode(value: string | null): string | null {
  const countryCode = value?.trim().toUpperCase() ?? ""
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null
}

function countryNameFromCode(countryCode: string | null): string | null {
  if (!countryCode) {
    return null
  }

  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode
  } catch {
    return countryCode
  }
}

function numberOrNull(value: number | string | null): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }
  return null
}

function formatAmount(amount: number | string | null, currency: string | null): string | null {
  const numericAmount = numberOrNull(amount)
  if (numericAmount === null || !currency) {
    return null
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(numericAmount)
  } catch {
    return `${currency} ${numericAmount.toLocaleString("en")}`
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Date not reported"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Date not reported"
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)
}
