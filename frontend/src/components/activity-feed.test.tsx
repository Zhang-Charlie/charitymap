import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ActivityFeed } from "@/components/activity-feed"

describe("ActivityFeed", () => {
  it("keeps source evidence visible for published records", () => {
    render(
      <ActivityFeed
        dataState="ready"
        message={null}
        events={[
          {
            id: "event-1",
            headline: "Water programme disbursement",
            funderName: "Example Funder",
            recipientName: "Example Recipient",
            amountLabel: "$1,250.50",
            countryName: "KE",
            sectorName: "14020",
            status: "disbursed",
            reportedAt: "1 Feb 2026",
            locationPrecision: "exact",
            coordinates: { latitude: -1.286389, longitude: 36.817223 },
            source: {
              publisher: "IATI",
              url: "https://example.org/iati/source"
            }
          }
        ]}
      />
    )

    expect(screen.getByRole("link", { name: "Source: IATI" })).toHaveAttribute(
      "href",
      "https://example.org/iati/source"
    )
    expect(screen.getByText("disbursed")).toBeInTheDocument()
  })
})
