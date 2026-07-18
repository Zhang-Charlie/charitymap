"use client"

import { useEffect, useRef } from "react"
import maplibregl, { type Map } from "maplibre-gl"
import { Globe2, MapPinned } from "lucide-react"

export function MapPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL

  useEffect(() => {
    if (!containerRef.current || !styleUrl || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [12, 18],
      zoom: 1.4,
      attributionControl: {}
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [styleUrl])

  if (styleUrl) {
    return <div ref={containerRef} className="h-full min-h-[32rem] w-full" />
  }

  return (
    <div className="relative flex h-full min-h-[32rem] items-center justify-center overflow-hidden bg-[#0a1713]">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(104,224,165,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(104,224,165,.13)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute left-[22%] top-[28%] h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(104,224,165,.8)]" />
      <div className="absolute left-[57%] top-[44%] h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_28px_rgba(104,224,165,.8)]" />
      <div className="absolute right-[18%] top-[31%] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(104,224,165,.8)]" />
      <div className="relative z-10 mx-6 max-w-md rounded-3xl border border-white/10 bg-black/35 p-7 text-center backdrop-blur-xl">
        <Globe2 className="mx-auto h-10 w-10 text-emerald-300" />
        <h2 className="mt-4 text-xl font-semibold">Map foundation ready</h2>
        <p className="mt-2 text-sm leading-6 text-[#a9bbb3]">
          Add a hosted MapLibre style URL to render the real base map. Funding markers will come from CharityMap data rather than the tile provider.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200">
          <MapPinned className="h-3.5 w-3.5" />
          NEXT_PUBLIC_MAP_STYLE_URL
        </div>
      </div>
    </div>
  )
}
