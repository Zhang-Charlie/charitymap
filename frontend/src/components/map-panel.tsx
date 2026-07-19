"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { FeatureCollection, Geometry } from "geojson"
import type { Map, StyleSpecification } from "maplibre-gl"
import { AlertTriangle, Globe2, MapPinned } from "lucide-react"
import type { FundingDataState, FundingEventSummary, FundingStatus } from "@/lib/domain"
import { getMapCoverage, type CountryCoverage } from "@/lib/map-coverage"

const countrySourceId = "country-boundaries"
const countryFillLayerId = "funding-countries-fill"
const countryOutlineLayerId = "funding-countries-outline"

type CountryBoundaryProperties = {
  countryCode: string
  countryName: string
  labelLatitude: number
  labelLongitude: number
}

type CountryBoundaryCollection = FeatureCollection<Geometry, CountryBoundaryProperties>

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
  disbursed: "bg-sky-600",
  reported_spend: "bg-violet-600",
  cancelled: "bg-zinc-500",
  unknown: "bg-slate-500"
} as const

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

function createMarkerElement(status: FundingStatus) {
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

function createPopupElement(event: FundingEventSummary) {
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

  const source = document.createElement("a")
  source.href = event.source.url
  source.target = "_blank"
  source.rel = "noreferrer"
  source.style.display = "inline-block"
  source.style.marginTop = "8px"
  source.style.color = "#2563eb"
  source.style.fontSize = "12px"
  source.textContent = `Source: ${event.source.publisher}`

  popup.append(headline, amount, detail, source)
  return popup
}

function createCountryPopupElement(country: CountryCoverage) {
  const popup = document.createElement("div")
  popup.style.minWidth = "190px"

  const headline = document.createElement("p")
  headline.style.margin = "0 0 5px"
  headline.style.fontWeight = "700"
  headline.style.color = "#18211d"
  headline.textContent = country.name

  const count = document.createElement("p")
  count.style.margin = "0 0 5px"
  count.style.color = "#2563eb"
  count.style.fontWeight = "600"
  count.textContent = `${country.eventCount} approved ${country.eventCount === 1 ? "record" : "records"}`

  const detail = document.createElement("p")
  detail.style.margin = "0"
  detail.style.color = "#66747d"
  detail.style.fontSize = "12px"
  detail.textContent = "IATI reports the country, but not an exact point."

  popup.append(headline, count, detail)
  return popup
}

function createCountryMarkerElement(country: CountryCoverage) {
  const marker = document.createElement("div")
  marker.className = [
    "grid h-8 min-w-8 place-items-center rounded-full border-2 border-white bg-blue-700 px-2",
    "text-xs font-bold text-white shadow-lg transition-transform hover:scale-110"
  ].join(" ")
  marker.setAttribute(
    "aria-label",
    `${country.eventCount} country-level funding ${country.eventCount === 1 ? "record" : "records"} in ${country.name}`
  )
  marker.textContent = String(country.eventCount)
  return marker
}

async function loadCountryBoundaries(countryCodes: string[]): Promise<CountryBoundaryCollection> {
  const response = await fetch("/data/countries-110m.geojson")
  if (!response.ok) {
    throw new Error("Country boundary data could not be loaded.")
  }

  const boundaries = (await response.json()) as CountryBoundaryCollection
  const includedCodes = new Set(countryCodes)
  return {
    type: "FeatureCollection",
    features: boundaries.features.filter(({ properties }) => includedCodes.has(properties.countryCode))
  }
}

type MapPanelProps = {
  events: FundingEventSummary[]
  dataState: FundingDataState
  message: string | null
}

export function MapPanel({ events, dataState, message }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim()
  const mapStyle = useMemo(() => styleUrl || defaultMapStyle, [styleUrl])
  const coverage = useMemo(() => getMapCoverage(events), [events])
  const hasMapLocations = coverage.exactEvents.length > 0 || coverage.countryLevelEventCount > 0

  useEffect(() => {
    if (!containerRef.current || mapRef.current || mapError) {
      return
    }

    let disposed = false
    let map: Map | null = null
    const reportMapError = (message: string) => {
      queueMicrotask(() => {
        if (!disposed) {
          setMapError(message)
        }
      })
    }

    const countryCodes = coverage.countries.map(({ code }) => code)

    void Promise.all([
      import("maplibre-gl"),
      countryCodes.length > 0 ? loadCountryBoundaries(countryCodes) : Promise.resolve(null)
    ])
      .then(([{ default: maplibregl }, countryBoundaries]) => {
        if (disposed || !containerRef.current) {
          return
        }

        map = new maplibregl.Map({
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

        const mappedEvents = coverage.exactEvents

        mappedEvents.forEach((event) => {
          if (!event.coordinates || !map) {
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
          if (!map) {
            return
          }
          const loadedMap = map

          if (countryBoundaries && coverage.countries.length > 0) {
            const boundaryByCode = new globalThis.Map(
              countryBoundaries.features.map((feature) => [feature.properties.countryCode, feature.properties])
            )
            const countryByCode = new globalThis.Map(
              coverage.countries.map((country) => [
                country.code,
                { ...country, name: boundaryByCode.get(country.code)?.countryName ?? country.name }
              ])
            )

            map.addSource(countrySourceId, {
              type: "geojson",
              data: countryBoundaries,
              attribution: "Country boundaries: Natural Earth"
            })
            map.addLayer({
              id: countryFillLayerId,
              type: "fill",
              source: countrySourceId,
              paint: {
                "fill-color": "#2563eb",
                "fill-opacity": 0.38
              }
            })
            map.addLayer({
              id: countryOutlineLayerId,
              type: "line",
              source: countrySourceId,
              paint: {
                "line-color": "#1d4ed8",
                "line-opacity": 0.9,
                "line-width": 2
              }
            })

            countryByCode.forEach((country, countryCode) => {
              const boundary = boundaryByCode.get(countryCode)
              if (!boundary) {
                return
              }

              const popup = new maplibregl.Popup({
                closeButton: false,
                offset: 18
              }).setDOMContent(createCountryPopupElement(country))

              new maplibregl.Marker({
                element: createCountryMarkerElement(country)
              })
                .setLngLat([boundary.labelLongitude, boundary.labelLatitude])
                .setPopup(popup)
                .addTo(loadedMap)
            })

            map.on("click", countryFillLayerId, (event) => {
              if (!map) {
                return
              }
              const countryCode = String(event.features?.[0]?.properties?.countryCode ?? "")
              const country = countryByCode.get(countryCode)
              if (country) {
                new maplibregl.Popup({ closeButton: false })
                  .setLngLat(event.lngLat)
                  .setDOMContent(createCountryPopupElement(country))
                  .addTo(map)
              }
            })
            map.on("mouseenter", countryFillLayerId, () => {
              if (map) {
                map.getCanvas().style.cursor = "pointer"
              }
            })
            map.on("mouseleave", countryFillLayerId, () => {
              if (map) {
                map.getCanvas().style.cursor = ""
              }
            })
          }

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
          if (map && !map.isStyleLoaded()) {
            const message = event.error?.message ?? "The map style or tiles could not be loaded."
            reportMapError(message)
          }
        })

        mapRef.current = map
      })
      .catch((error: unknown) => {
        reportMapError(error instanceof Error ? error.message : "The map could not be initialized.")
      })

    return () => {
      disposed = true
      map?.remove()
      mapRef.current = null
    }
  }, [coverage, mapError, mapStyle])

  if (!mapError) {
    return (
      <section aria-label="Funding event map" className="relative h-[32rem] overflow-hidden bg-[#dce7f4] sm:h-[36rem] xl:h-full xl:min-h-0">
        <div ref={containerRef} className="h-full w-full" />
        <div className="pointer-events-none absolute left-14 top-4 rounded-md border border-black/10 bg-white/95 px-3 py-2 text-xs text-[#31414a] shadow-sm">
          <p className="font-semibold text-[#24342d]">Approved funding locations</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-1 ring-white" />
              {coverage.exactEvents.length} exact
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-3 border border-blue-700 bg-blue-500/30" />
              {coverage.countryLevelEventCount} country-level
            </span>
            {coverage.unlocatedEventCount > 0 ? <span>{coverage.unlocatedEventCount} unlocated</span> : null}
          </div>
        </div>
        {!hasMapLocations ? (
          <div className="pointer-events-none absolute bottom-5 left-5 max-w-sm rounded-md border border-black/10 bg-white/95 px-4 py-3 text-sm text-[#31414a] shadow-sm">
            <p className="font-medium">
              {dataState === "ready" ? "No approved map locations yet" : "Map data unavailable"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#66747d]">
              {message ?? "Records without a reported country or source-provided coordinates remain available in the funding feed."}
            </p>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <div className="relative flex h-[32rem] items-center justify-center overflow-hidden bg-[#eef4f8] text-[#18211d] sm:h-[36rem] xl:h-full xl:min-h-0">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(37,99,235,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.12)_1px,transparent_1px)] [background-size:48px_48px]" />
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
