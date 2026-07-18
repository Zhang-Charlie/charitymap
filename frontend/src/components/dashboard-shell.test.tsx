import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DashboardShell } from "@/components/dashboard-shell"

describe("DashboardShell", () => {
  it("shows the CharityMap identity and demo warning", () => {
    render(<DashboardShell />)

    expect(screen.getByText("CharityMap")).toBeInTheDocument()
    expect(screen.getAllByText("Demo data").length).toBeGreaterThan(0)
    expect(screen.getByText(/Demo records are placeholders/)).toBeInTheDocument()
  })
})
