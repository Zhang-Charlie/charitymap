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
    locationPrecision: "country",
    coordinates: {
      latitude: 0.0236,
      longitude: 37.9062
    },
    source: {
      publisher: "CharityMap demonstration fixture",
      url: "https://example.org/funding/demo-1"
    }
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
    locationPrecision: "region",
    coordinates: {
      latitude: 12.8797,
      longitude: 121.774
    },
    source: {
      publisher: "CharityMap demonstration fixture",
      url: "https://example.org/funding/demo-2"
    }
  },
  {
    id: "demo-3",
    headline: "Water programme disbursement reported",
    funderName: "Example Development Fund",
    recipientName: "Water Access Group",
    amountLabel: "€640,000",
    countryName: "Ghana",
    sectorName: "Water and sanitation",
    status: "disbursed",
    reportedAt: "Recently reported",
    locationPrecision: "country",
    coordinates: {
      latitude: 7.9465,
      longitude: -1.0232
    },
    source: {
      publisher: "CharityMap demonstration fixture",
      url: "https://example.org/funding/demo-3"
    }
  }
]
