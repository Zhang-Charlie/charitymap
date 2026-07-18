import Link from "next/link"
import { Code2, Filter, Search } from "lucide-react"
import { ActivityFeed } from "@/components/activity-feed"
import { MapPanel } from "@/components/map-panel"

export function DashboardShell() {
  return (
    <main className="min-h-screen bg-[#07110e] text-white">
      <header className="border-b border-white/10 bg-[#08130f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-4 py-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 font-bold text-[#06100c]">
                CM
              </span>
              <div>
                <p className="font-semibold tracking-tight">CharityMap</p>
                <p className="hidden text-xs text-[#879b91] sm:block">
                  Follow publicly reported funding
                </p>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-[#a9bbb3] md:flex">
            <Link className="text-white" href="/">Map</Link>
            <Link href="/methodology">Methodology</Link>
            <a href="https://github.com" aria-label="GitHub">
              <Code2 className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[#0b1713]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:px-6">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#879b91]">
            <Search className="h-4 w-4" />
            <input
              aria-label="Search CharityMap"
              className="w-full bg-transparent text-white outline-none placeholder:text-[#6f8279]"
              placeholder="Search organisations, projects or countries"
            />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#c7d6cf]">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 overflow-hidden border-x border-white/10 xl:grid-cols-[minmax(0,1fr)_420px]">
        <MapPanel />
        <ActivityFeed />
      </div>

      <footer className="border-t border-white/10 px-4 py-5 text-center text-xs text-[#71857b]">
        Demo records are placeholders. Public records will require a source and approval.
      </footer>
    </main>
  )
}
