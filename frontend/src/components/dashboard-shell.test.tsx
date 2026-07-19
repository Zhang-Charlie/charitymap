import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DashboardShell } from "@/components/dashboard-shell"

describe("DashboardShell", () => {
  it("shows the CharityMap identity and sourced-data empty state", () => {
    render(<DashboardShell events={[]} state="ready" message={null} />)

    expect(screen.getByText("CharityMap")).toBeInTheDocument()
    expect(screen.getAllByText("Approved records").length).toBeGreaterThan(0)
    expect(screen.getByText(/No approved funding records yet/)).toBeInTheDocument()
    expect(screen.getByText(/manually reviewed before release/)).toBeInTheDocument()
  })
})
