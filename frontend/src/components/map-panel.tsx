"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import maplibregl, { type Map, type StyleSpecification } from "maplibre-gl"
import { AlertTriangle, Globe2, MapPinned } from "lucide-react"
import { mockFundingEvents } from "@/lib/mock-data"

const defaultMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "openstreetmap-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "openstreetmap-tiles",
      type: "raster",
      source: "openstreetmap-tiles"
    }
  ]
}

const markerStyles = {
  announced: "bg-amber-500",
  committed: "bg-blue-600",
  partially_disbursed: "bg-sky-600",
  fully_disbursed: "bg-indigo-600",
  reported_expenditure: "bg-violet-600",
  cancelled: "bg-zinc-500",
  unknown: "bg-slate-500"
} as const

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

function createMarkerElement(status: keyof typeof markerStyles) {
  const marker = document.createElement("div")
  marker.className = [
    "grid h-9 w-9 place-items-center rounded-full border-2 border-white text-white shadow-lg",
    "transition-transform hover:scale-110",
    markerStyles[status]
  ].join(" ")
  marker.setAttribute("aria-label", `${formatStatus(status)} funding event`)
  const symbol = document.createElement("span")
  symbol.className = "text-base font-bold"
  symbol.textContent = "£"
  marker.append(symbol)
  return marker
}

function createPopupElement(event: (typeof mockFundingEvents)[number]) {
  const popup = document.createElement("div")
  popup.style.minWidth = "180px"

  const headline = document.createElement("p")
  headline.style.margin = "0 0 6px"
  headline.style.fontWeight = "700"
  headline.style.color = "#18211d"
  headline.textContent = event.headline

  const amount = document.createElement("p")
  amount.style.margin = "0 0 4px"
  amount.style.color = "#2563eb"
  amount.textContent = event.amountLabel ?? "Amount not reported"

  const detail = document.createElement("p")
  detail.style.margin = "0"
  detail.style.color = "#66747d"
  detail.textContent = `${formatStatus(event.status)} · ${event.countryName ?? "Unknown location"}`

  popup.append(headline, amount, detail)
  return popup
}

export function MapPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL
  const mapStyle = useMemo(() => styleUrl ?? defaultMapStyle, [styleUrl])

  useEffect(() => {
    if (!containerRef.current || mapRef.current || mapError) {
      return
    }

    let disposed = false
    const reportMapError = (message: string) => {
      queueMicrotask(() => {
        if (!disposed) {
          setMapError(message)
        }
      })
    }

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [18, 24],
        zoom: 2.1,
        minZoom: 1,
        attributionControl: {
          compact: true
        }
      })

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left")
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left")

      const mappedEvents = mockFundingEvents.filter((event) => event.coordinates)

      mappedEvents.forEach((event) => {
        if (!event.coordinates) {
          return
        }

        const popup = new maplibregl.Popup({
          closeButton: false,
          offset: 18
        }).setDOMContent(createPopupElement(event))

        new maplibregl.Marker({
          element: createMarkerElement(event.status)
        })
          .setLngLat([event.coordinates.longitude, event.coordinates.latitude])
          .setPopup(popup)
          .addTo(map)
      })

      map.once("load", () => {
        if (mappedEvents.length < 2) {
          return
        }

        const bounds = new maplibregl.LngLatBounds()

        mappedEvents.forEach((event) => {
          if (event.coordinates) {
            bounds.extend([event.coordinates.longitude, event.coordinates.latitude])
          }
        })

        map.fitBounds(bounds, {
          duration: 0,
          maxZoom: 3.2,
          padding: 80
        })
      })

      map.on("error", (event) => {
        if (!map.loaded()) {
          const message = event.error?.message ?? "The map style or tiles could not be loaded."
          reportMapError(message)
        }
      })

      mapRef.current = map
    } catch (error) {
      reportMapError(error instanceof Error ? error.message : "The map could not be initialized.")
    }

    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [mapError, mapStyle])

  if (!mapError) {
    return (
      <section aria-label="Funding event map" className="relative h-full min-h-[32rem] overflow-hidden bg-[#dce7f4]">
        <div ref={containerRef} className="h-full min-h-[32rem] w-full" />
        <div className="pointer-events-none absolute left-14 top-4 rounded-md border border-black/10 bg-white/90 px-3 py-2 text-xs font-medium text-[#24342d] shadow-sm">
          Demo funding locations
        </div>
      </section>
    )
  }

  return (
    <div className="relative flex h-full min-h-[32rem] items-center justify-center overflow-hidden bg-[#eef4f8] text-[#18211d]">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(37,99,235,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute left-[22%] top-[28%] h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_24px_rgba(37,99,235,.35)]" />
      <div className="absolute left-[57%] top-[44%] h-4 w-4 rounded-full bg-cyan-500 shadow-[0_0_28px_rgba(8,145,178,.35)]" />
      <div className="absolute right-[18%] top-[31%] h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_22px_rgba(245,158,11,.35)]" />
      <div className="relative z-10 mx-6 max-w-md rounded-lg border border-[#d9e2e7] bg-white/90 p-7 text-center shadow-sm backdrop-blur-xl">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-4 text-xl font-semibold">Map unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-[#66747d]">
          The funding feed is still available. Check the map style URL or network access, then reload the page.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          <Globe2 className="h-3.5 w-3.5" />
          <MapPinned className="h-3.5 w-3.5" />
          {mapError}
        </div>
      </div>
    </div>
  )
}
