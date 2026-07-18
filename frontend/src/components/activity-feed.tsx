import { ArrowRight, Building2, Clock3, MapPin } from "lucide-react"
import type { FundingStatus } from "@/lib/domain"
import { mockFundingEvents } from "@/lib/mock-data"

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

const statusStyles: Record<FundingStatus, string> = {
  announced: "bg-amber-50 text-amber-800 ring-amber-200",
  committed: "bg-blue-50 text-blue-800 ring-blue-200",
  partially_disbursed: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  fully_disbursed: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  reported_expenditure: "bg-violet-50 text-violet-800 ring-violet-200",
  cancelled: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  unknown: "bg-slate-100 text-slate-700 ring-slate-200"
}

export function ActivityFeed() {
  return (
    <aside className="flex h-full min-h-[32rem] flex-col border-l border-[#d9e2e7] bg-white">
      <div className="border-b border-[#d9e2e7] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Activity feed
            </p>
            <h2 className="mt-1 text-lg font-semibold">Recently reported</h2>
          </div>
          <span className="rounded-full border border-[#d9e2e7] bg-[#f6f8fb] px-3 py-1 text-xs text-[#66747d]">
            Demo data
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockFundingEvents.map((event) => (
          <article
            key={event.id}
            className="group border-b border-[#e7eef2] p-5 transition hover:bg-[#f7fafc]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ${statusStyles[event.status]}`}>
                {statusLabel(event.status)}
              </span>
              <Clock3 className="h-4 w-4 text-[#8a99a3]" />
            </div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-[#18211d]">
              {event.headline}
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#2563eb]">
              {event.amountLabel}
            </p>
            <div className="mt-4 space-y-2 text-sm text-[#66747d]">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {event.funderName} <ArrowRight className="h-3.5 w-3.5" /> {event.recipientName}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.countryName} · {event.locationPrecision}-level location
              </p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}
