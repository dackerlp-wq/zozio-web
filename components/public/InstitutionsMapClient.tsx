'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export interface MapInstitution {
  id: string
  name: string
  slug: string
  type: 'shelter' | 'rescue_station'
  city: string | null
  lat: number | null
  lng: number | null
  logo_url: string | null
  coverage_cities: string[] | null
  animal_count?: number
}

interface Props {
  institutions: MapInstitution[]
}

export function InstitutionsMapClient({ institutions }: Props) {
  const mapRef        = useRef<HTMLDivElement>(null)
  const mapInstance   = useRef<any>(null)
  const markersRef    = useRef<Record<string, any>>({})
  const coverageRef   = useRef<any[]>([])
  const polygonCache  = useRef<Record<string, any>>({}) // place name → GeoJSON feature or null
  const [selected,   setSelected]   = useState<MapInstitution | null>(null)
  const [filter,     setFilter]     = useState<'all' | 'shelter' | 'rescue_station'>('all')
  const [search,     setSearch]     = useState('')
  // Geographic hierarchy resolved from Nominatim: [placeName, "Okres X", "Y kraj"]
  const [hierarchy,  setHierarchy]  = useState<string[]>([])
  const searchTimer = useRef<any>(null)

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  useEffect(() => {
    clearTimeout(searchTimer.current)
    setHierarchy([])  // clear immediately so stale data doesn't leak into filter
    if (!search.trim()) return
    searchTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&countrycodes=cz,sk&format=json&limit=1&addressdetails=1`,
          { headers: { 'Accept-Language': 'cs' } }
        )
        const [hit] = await res.json()
        if (!hit?.address) return
        const a     = hit.address
        const terms: string[] = []

        // 1. Place name itself
        const place = a.city || a.town || a.village || a.hamlet
        if (place) terms.push(place)

        // 2. District — Nominatim CZ: state_district = "okres Kladno"
        const sd = a.state_district // e.g. "okres Kladno"
        if (sd) {
          const bare = sd.replace(/^okres\s+/i, '').trim()  // "Kladno"
          terms.push(`Okres ${bare}`)                        // "Okres Kladno"
        }

        // 3. Region — Nominatim CZ: state = "Středočeský kraj"
        if (a.state) terms.push(a.state)

        setHierarchy(terms)
      } catch {}
    }, 350)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Does a coverage entry match the search hierarchy?
  function coverageMatches(coverageCity: string, q: string, geo: string[]): boolean {
    const nc = norm(coverageCity)
    // Direct substring match with typed query
    if (nc.includes(norm(q))) return true
    // Match against resolved geographic hierarchy (district, region)
    return geo.some(term => norm(term) === nc)
  }

  const withCoords = institutions.filter(i => i.lat && i.lng)
  const filtered   = withCoords.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false
    if (search) {
      const matchesName     = norm(i.name).includes(norm(search))
      const matchesOwnCity  = i.city ? norm(i.city).includes(norm(search)) : false
      const matchesCoverage = i.coverage_cities?.some(c => coverageMatches(c, search, hierarchy))
      if (!matchesName && !matchesOwnCity && !matchesCoverage) return false
    }
    return true
  })

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    // StrictMode double-invoke guard: clear any leftover Leaflet ID on the DOM node
    if ((mapRef.current as any)._leaflet_id) {
      delete (mapRef.current as any)._leaflet_id
    }

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstance.current) return
      const map = L.map(mapRef.current!, {
        center:    [49.8, 15.5],
        zoom:      7,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      mapInstance.current = map
      setTimeout(() => map.invalidateSize(), 0)
      buildMarkers(L, map)
    })

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rebuild markers when filter/search changes
  useEffect(() => {
    if (!mapInstance.current) return
    import('leaflet').then(L => buildMarkers(L, mapInstance.current))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search])

  function buildMarkers(L: any, map: any) {
    // Remove old markers and coverage
    Object.values(markersRef.current).forEach((m: any) => m.remove())
    markersRef.current = {}
    clearCoverage()
    setSelected(null)

    filtered.forEach(inst => {
      if (!inst.lat || !inst.lng) return

      const isShelter = inst.type === 'shelter'
      const color     = isShelter ? '#E8634A' : '#2E9E8F'
      const bg        = isShelter ? '#FAECE7' : '#E1F5EE'

      const icon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);font-size:14px">${isShelter ? '🏠' : '🚑'}</span></div>`,
        className: '',
        iconSize:  [32, 32],
        iconAnchor:[16, 32],
        popupAnchor:[0, -34],
      })

      const coverageHtml = inst.coverage_cities?.length
        ? `<div style="margin-top:8px;border-top:1px solid #F0EDE8;padding-top:8px">
            <div style="font-size:10px;font-weight:700;color:#8B6550;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Dosah</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${inst.coverage_cities.slice(0, 8).map(c =>
                `<span style="font-size:11px;padding:1px 6px;border-radius:100px;background:${bg};color:${color};font-weight:600">${c}</span>`
              ).join('')}
              ${inst.coverage_cities.length > 8 ? `<span style="font-size:11px;color:#8B6550">+${inst.coverage_cities.length - 8} dalších</span>` : ''}
            </div>
          </div>`
        : ''

      const popup = L.popup({ maxWidth: 240, className: 'zoz-popup' }).setContent(`
        <div style="font-family:system-ui;padding:2px">
          <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">
            ${isShelter ? '🏠 Útulek' : '🚑 Záchranná stanice'}
          </div>
          <div style="font-weight:700;font-size:14px;color:#1A0F0A;margin-bottom:2px">${inst.name}</div>
          ${inst.city ? `<div style="font-size:12px;color:#8B6550">📍 ${inst.city}</div>` : ''}
          ${coverageHtml}
          <a href="/institutions/${inst.slug}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:${color}">
            Zobrazit profil →
          </a>
        </div>
      `)

      const marker = L.marker([inst.lat, inst.lng], { icon })
        .addTo(map)
        .bindPopup(popup)

      marker.on('click', () => {
        setSelected(inst)
        drawCoverage(L, map, inst)
      })
      markersRef.current[inst.id] = marker
    })
  }

  function clearCoverage() {
    coverageRef.current.forEach(c => c.remove())
    coverageRef.current = []
  }

  async function fetchPolygon(placeName: string): Promise<any | null> {
    if (placeName in polygonCache.current) return polygonCache.current[placeName]
    try {
      const q = encodeURIComponent(placeName)
      const url = `https://nominatim.openstreetmap.org/search?q=${q}&countrycodes=cz,sk&polygon_geojson=1&format=json&limit=3`
      const res  = await fetch(url, { headers: { 'Accept-Language': 'cs' } })
      const data = await res.json()
      // Prefer result with polygon/multipolygon type
      const hit = data.find((d: any) =>
        d.geojson?.type === 'Polygon' || d.geojson?.type === 'MultiPolygon'
      ) ?? null
      const geojson = hit?.geojson ?? null
      polygonCache.current[placeName] = geojson
      return geojson
    } catch {
      polygonCache.current[placeName] = null
      return null
    }
  }

  async function drawCoverage(L: any, map: any, inst: MapInstitution) {
    clearCoverage()
    if (!inst.coverage_cities?.length) return
    const color = inst.type === 'shelter' ? '#E8634A' : '#2E9E8F'

    await Promise.all(inst.coverage_cities.map(async cityName => {
      const geojson = await fetchPolygon(cityName)
      if (!geojson || !mapInstance.current) return
      const layer = L.geoJSON(geojson, {
        style: {
          color,
          fillColor:   color,
          fillOpacity: 0.22,
          weight:      2,
          opacity:     0.7,
        },
      }).addTo(map)
      coverageRef.current.push(layer)
    }))

    // Fit map to all coverage layers
    if (coverageRef.current.length > 0 && mapInstance.current) {
      try {
        const group = L.featureGroup(coverageRef.current)
        map.fitBounds(group.getBounds().pad(0.1), { duration: 0.8, maxZoom: 11 })
      } catch {}
    }
  }

  function flyTo(inst: MapInstitution) {
    if (!mapInstance.current || !inst.lat || !inst.lng) return
    import('leaflet').then(L => drawCoverage(L, mapInstance.current, inst))
    mapInstance.current.flyTo([inst.lat, inst.lng], 10, { duration: 0.8 })
    markersRef.current[inst.id]?.openPopup()
    setSelected(inst)
  }

  const isShelter  = (i: MapInstitution) => i.type === 'shelter'
  const listItems  = filtered

  return (
    <>
      {/* Leaflet CSS */}
      <style>{`
        .leaflet-container { background: #F5F0EA; }
        .zoz-popup .leaflet-popup-content-wrapper { border-radius:12px; border:1px solid #F0EDE8; box-shadow:0 4px 16px rgba(0,0,0,0.10); padding:0; }
        .zoz-popup .leaflet-popup-content { margin:14px; }
        .zoz-popup .leaflet-popup-tip-container { display:none; }
        .leaflet-control-attribution { font-size:10px !important; }
      `}</style>

      <div className="flex h-[calc(100vh-180px)] min-h-[500px] rounded-lg overflow-hidden border border-[#F0EDE8]">

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-[#F0EDE8] flex flex-col">

          {/* Filters */}
          <div className="p-4 border-b border-[#F0EDE8]">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Hledat město, okres, útulek..."
              className="w-full px-3 py-2 rounded-lg border border-[#E0DDD8] text-sm focus:outline-none focus:border-[#E8634A] mb-3"
            />
            <div className="flex gap-2">
              {(['all', 'shelter', 'rescue_station'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all"
                  style={{
                    background: filter === f ? (f === 'rescue_station' ? '#2E9E8F' : f === 'shelter' ? '#E8634A' : '#1A0F0A') : '#F5F3F0',
                    color:      filter === f ? 'white' : '#6B4030',
                  }}>
                  {f === 'all' ? 'Vše' : f === 'shelter' ? '🏠 Útulky' : '🚑 Stanice'}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {listItems.length === 0 && (
              <div className="p-6 text-center text-sm" style={{ color: '#8B6550' }}>
                {search ? `Žádná instituce s dosahem do „${search}"` : 'Žádné výsledky'}
              </div>
            )}
            {listItems.map(inst => {
              const color = isShelter(inst) ? '#E8634A' : '#2E9E8F'
              const bg    = isShelter(inst) ? '#FAECE7' : '#E1F5EE'
              const isActive = selected?.id === inst.id
              return (
                <button key={inst.id} onClick={() => flyTo(inst)}
                  className="w-full text-left px-4 py-3 border-b border-[#F8F5F2] cursor-pointer transition-all hover:bg-[#FAFAF8] border-none"
                  style={{ background: isActive ? '#F5F3F0' : 'white' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
                      style={{ background: bg }}>
                      {inst.logo_url
                        ? <Image src={inst.logo_url} alt={inst.name} width={32} height={32} className="rounded-lg object-cover" />
                        : <span>{isShelter(inst) ? '🏠' : '🚑'}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-[#1A0F0A] truncate">{inst.name}</div>
                      {inst.city && <div className="text-[11px] mt-0.5" style={{ color: '#8B6550' }}>📍 {inst.city}</div>}
                      {inst.coverage_cities?.length ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {inst.coverage_cities.slice(0, 3).map(c => (
                            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: bg, color }}>
                              {c}
                            </span>
                          ))}
                          {inst.coverage_cities.length > 3 && (
                            <span className="text-[10px]" style={{ color: '#8B6550' }}>
                              +{inst.coverage_cities.length - 3}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full mt-0.5"
                      style={{ background: bg, color }}>
                      {isShelter(inst) ? 'Útulek' : 'Stanice'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Count */}
          <div className="px-4 py-2.5 border-t border-[#F0EDE8] text-xs" style={{ color: '#8B6550' }}>
            {filtered.length} z {withCoords.length} institucí na mapě
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-[#F0EDE8] p-3 flex items-center gap-3 z-[1000]">
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
                style={{ background: isShelter(selected) ? '#FAECE7' : '#E1F5EE' }}>
                {selected.logo_url
                  ? <Image src={selected.logo_url} alt={selected.name} width={36} height={36} className="rounded-lg object-cover" />
                  : <span>{isShelter(selected) ? '🏠' : '🚑'}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[#1A0F0A] truncate">{selected.name}</div>
                <div className="text-xs" style={{ color: '#8B6550' }}>
                  {selected.city}
                  {selected.coverage_cities?.length ? ` · dosah: ${selected.coverage_cities.length} měst` : ''}
                </div>
              </div>
              <Link href={`/institutions/${selected.slug}`}
                className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border flex-shrink-0"
                style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                Profil →
              </Link>
              <button onClick={() => setSelected(null)}
                className="text-sm border-none bg-transparent cursor-pointer flex-shrink-0"
                style={{ color: '#8B6550' }}>
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
