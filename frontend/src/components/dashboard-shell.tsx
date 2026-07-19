import Link from "next/link"
import { Code2, Filter, Search } from "lucide-react"
import { ActivityFeed } from "@/components/activity-feed"
import { MapPanel } from "@/components/map-panel"
import type { FundingDataState, FundingEventSummary } from "@/lib/domain"

type DashboardShellProps = {
  events: FundingEventSummary[]
  state: FundingDataState
  message: string | null
}

export function DashboardShell({ events, state, message }: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#18211d]">
      <header className="border-b border-[#d9e2e7] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-4 py-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#2563eb] font-bold text-white shadow-sm">
                CM
              </span>
              <div>
                <p className="font-semibold tracking-tight">CharityMap</p>
                <p className="hidden text-xs text-[#66747d] sm:block">
                  Follow publicly reported funding
                </p>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-[#66747d] md:flex">
            <Link className="font-medium text-[#18211d]" href="/">Map</Link>
            <Link href="/methodology">Methodology</Link>
            <a href="https://github.com" aria-label="GitHub">
              <Code2 className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#d9e2e7] bg-[#eef3f6]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:px-6">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#cfdbe2] bg-white px-4 py-3 text-sm text-[#66747d] shadow-sm">
            <Search className="h-4 w-4" />
            <input
              aria-label="Search CharityMap"
              className="w-full bg-transparent text-[#18211d] outline-none placeholder:text-[#87949c]"
              placeholder="Search organisations, projects or countries"
            />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cfdbe2] bg-white px-4 py-3 text-sm font-medium text-[#31414a] shadow-sm">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 overflow-hidden border-x border-[#d9e2e7] bg-white xl:grid-cols-[minmax(0,1fr)_420px]">
        <MapPanel events={events} dataState={state} message={message} />
        <ActivityFeed events={events} dataState={state} message={message} />
      </div>

      <footer className="border-t border-[#d9e2e7] bg-white px-4 py-5 text-center text-xs text-[#66747d]">
        Published records are sourced from public disclosures and manually reviewed before release.
      </footer>
    </main>
  )
}
