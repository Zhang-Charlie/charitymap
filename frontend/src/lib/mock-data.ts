import type { FundingEventSummary } from "@/lib/domain"

export const mockFundingEvents: FundingEventSummary[] = [
  {
    id: "demo-1",
    headline: "Education grant reported",
    funderName: "Example Foundation",
    recipientName: "Learning Partnership",
    amountLabel: "€2.4 million",
    countryName: "Kenya",
    sectorName: "Education",
    status: "committed",
    reportedAt: "Recently reported",
    locationPrecision: "country"
  },
  {
    id: "demo-2",
    headline: "Emergency support announced",
    funderName: "Example Company",
    recipientName: "Relief Network",
    amountLabel: "$850,000",
    countryName: "Philippines",
    sectorName: "Humanitarian response",
    status: "announced",
    reportedAt: "Recently reported",
    locationPrecision: "region"
  },
  {
    id: "demo-3",
    headline: "Water programme disbursement reported",
    funderName: "Example Development Fund",
    recipientName: "Water Access Group",
    amountLabel: "€640,000",
    countryName: "Ghana",
    sectorName: "Water and sanitation",
    status: "fully_disbursed",
    reportedAt: "Recently reported",
    locationPrecision: "country"
  }
]
