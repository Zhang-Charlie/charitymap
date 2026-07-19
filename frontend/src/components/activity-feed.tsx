import { ArrowRight, Building2, Clock3, ExternalLink, MapPin } from "lucide-react"
import type { FundingDataState, FundingEventSummary, FundingStatus } from "@/lib/domain"

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

const statusStyles: Record<FundingStatus, string> = {
  announced: "bg-amber-50 text-amber-800 ring-amber-200",
  committed: "bg-blue-50 text-blue-800 ring-blue-200",
  disbursed: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  reported_spend: "bg-violet-50 text-violet-800 ring-violet-200",
  cancelled: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  unknown: "bg-slate-100 text-slate-700 ring-slate-200"
}

type ActivityFeedProps = {
  events: FundingEventSummary[]
  dataState: FundingDataState
  message: string | null
}

export function ActivityFeed({ events, dataState, message }: ActivityFeedProps) {
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
            Approved records
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-sm leading-6 text-[#66747d]" role="status">
            <p className="font-medium text-[#31414a]">
              {dataState === "ready" ? "No approved funding records yet" : "Funding data unavailable"}
            </p>
            <p className="mt-2">
              {message ?? "Imported records appear here after an evidence review approves them for publication."}
            </p>
          </div>
        ) : events.map((event) => (
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
              {event.amountLabel ?? "Amount not reported"}
            </p>
            <div className="mt-4 space-y-2 text-sm text-[#66747d]">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {event.funderName} <ArrowRight className="h-3.5 w-3.5" /> {event.recipientName ?? "Recipient not reported"}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.countryName ?? "Location not reported"} · {event.locationPrecision}-level location
              </p>
              <p className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <a
                  className="font-medium text-[#2563eb] underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                  href={event.source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Source: {event.source.publisher}
                </a>
              </p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}
