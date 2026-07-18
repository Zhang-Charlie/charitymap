import { ArrowRight, Building2, Clock3, MapPin } from "lucide-react"
import { mockFundingEvents } from "@/lib/mock-data"

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

export function ActivityFeed() {
  return (
    <aside className="flex h-full min-h-[32rem] flex-col border-l border-white/10 bg-[#0c1814]/95">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Activity feed
            </p>
            <h2 className="mt-1 text-lg font-semibold">Recently reported</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#a9bbb3]">
            Demo data
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockFundingEvents.map((event) => (
          <article
            key={event.id}
            className="group border-b border-white/8 p-5 transition hover:bg-white/[0.035]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[11px] font-medium capitalize text-emerald-200">
                {statusLabel(event.status)}
              </span>
              <Clock3 className="h-4 w-4 text-[#72867c]" />
            </div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-white">
              {event.headline}
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-300">
              {event.amountLabel}
            </p>
            <div className="mt-4 space-y-2 text-sm text-[#a9bbb3]">
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
