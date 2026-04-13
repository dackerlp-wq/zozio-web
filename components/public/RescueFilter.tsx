'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RescueFilterProps {
  species: { id: string; name_cs: string; icon: string | null }[]
  cities:  string[]
  params:  Record<string, string | undefined>
  total:   number
}

function buildUrl(params: any, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides, page: undefined }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/rescue${str ? `?${str}` : ''}`
}

export function RescueFilter({ species, cities, params, total }: RescueFilterProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const router = useRouter()

  const hasLoc  = !!(params.lat && params.lng)
  const activeCount = [params.status, params.sex, params.species, hasLoc ? 'loc' : params.city].filter(Boolean).length

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleGps = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLoading(false)
        setMobileOpen(false)
        router.push(buildUrl(params, {
          lat:  String(pos.coords.latitude.toFixed(4)),
          lng:  String(pos.coords.longitude.toFixed(4)),
          city: undefined,
        }))
      },
      () => setGpsLoading(false),
      { timeout: 8000 }
    )
  }

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all no-underline
    ${active
      ? 'border-[#2E9E8F] text-[#0F6E56] bg-[#E1F5EE]'
      : 'border-[#F0EDE8] text-[#6B4030] bg-white hover:border-[#2E9E8F]/40'}`

  const divider = <div className="h-px bg-[#F0EDE8] my-4" />

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: '#8B6550' }}>
        {title}
      </span>
      {children}
    </div>
  )

  const panelContent = (
    <div>
      {/* Oblast / poloha */}
      <Section title="Oblast">
        {/* GPS tlačítko — pouze mobil */}
        <button
          onClick={handleGps}
          disabled={gpsLoading}
          className="md:hidden w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all"
          style={{
            background: hasLoc ? '#E1F5EE' : '#2E9E8F',
            color:      hasLoc ? '#0F6E56' : 'white',
            opacity:    gpsLoading ? 0.7 : 1,
          }}>
          {gpsLoading
            ? '⏳ Zjišťuji polohu…'
            : hasLoc
              ? '📍 Z vašeho okolí ✓'
              : '📍 Příběhy z mého okolí'}
        </button>

        {hasLoc ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-2"
            style={{ background: '#E1F5EE', border: '1px solid #BDE8D0' }}>
            <span className="text-xs font-semibold" style={{ color: '#0F6E56' }}>
              📍 {params.city ?? 'Vaše okolí'}
            </span>
            <Link
              href={buildUrl(params, { lat: undefined, lng: undefined, city: undefined })}
              className="text-xs font-bold no-underline"
              style={{ color: '#2E9E8F' }}>
              × Zrušit
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <Link href={buildUrl(params, { city: undefined })}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-all
                ${!params.city ? 'text-[#0F6E56] bg-[#E1F5EE]' : 'text-[#6B4030] hover:bg-[#F5FAF9]'}`}>
              Celá ČR a SR
            </Link>
            {cities.map(city => (
              <Link key={city}
                href={buildUrl(params, { city: params.city === city ? undefined : city })}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-all
                  ${params.city === city ? 'text-[#0F6E56] bg-[#E1F5EE]' : 'text-[#6B4030] hover:bg-[#F5FAF9]'}`}>
                {city}
              </Link>
            ))}
          </div>
        )}
      </Section>

      {divider}

      {/* Stav léčby */}
      <Section title="Stav léčby">
        <div className="flex flex-wrap gap-1.5">
          <Link href={buildUrl(params, { status: undefined })} className={chip(!params.status)}>Všechny</Link>
          {[
            { value: 'intake',         label: '🚑 Příjem' },
            { value: 'treatment',      label: '🩺 Léčba' },
            { value: 'rehabilitation', label: '💪 Rehabilitace' },
            { value: 'released',       label: '🌿 Propuštěno' },
          ].map(({ value, label }) => (
            <Link key={value}
              href={buildUrl(params, { status: params.status === value ? undefined : value })}
              className={chip(params.status === value)}>
              {label}
            </Link>
          ))}
        </div>
      </Section>

      {divider}

      {/* Pohlaví */}
      <Section title="Pohlaví">
        <div className="flex flex-wrap gap-1.5">
          <Link href={buildUrl(params, { sex: undefined })} className={chip(!params.sex)}>Všechna</Link>
          <Link href={buildUrl(params, { sex: params.sex === 'male' ? undefined : 'male' })}
            className={chip(params.sex === 'male')}>♂ Samec</Link>
          <Link href={buildUrl(params, { sex: params.sex === 'female' ? undefined : 'female' })}
            className={chip(params.sex === 'female')}>♀ Samice</Link>
        </div>
      </Section>

      {/* Druh zvířete */}
      {species.length > 0 && (
        <>
          {divider}
          <Section title="Druh zvířete">
            <div className="flex flex-wrap gap-1.5">
              <Link href={buildUrl(params, { species: undefined })} className={chip(!params.species)}>Všechna</Link>
              {species.map(s => (
                <Link key={s.id}
                  href={buildUrl(params, { species: params.species === s.id ? undefined : s.id })}
                  className={chip(params.species === s.id)}>
                  {s.icon && <span>{s.icon}</span>}{s.name_cs}
                </Link>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Zrušit filtry */}
      {activeCount > 0 && (
        <>
          {divider}
          <Link href="/rescue"
            className="block w-full py-2.5 rounded-lg text-xs font-bold text-center no-underline hover:opacity-80 transition-all"
            style={{ background: '#F0EDE8', color: '#6B4030' }}>
            Zrušit filtry ({activeCount})
          </Link>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white rounded-lg border border-[#F0EDE8] p-4">
          {panelContent}
        </div>
      </div>

      {/* Mobilní plovoucí tlačítko */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm text-white border-none cursor-pointer"
        style={{ background: '#2E9E8F', boxShadow: '0 4px 20px rgba(46,158,143,0.45)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 4h12M4 8h8M6 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Filtry
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.28)' }}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobilní bottom sheet */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] flex flex-col"
            style={{ background: '#FFFCF8' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: '#E0DDD8' }} />
            </div>

            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <span className="font-bold text-base text-[#1A0F0A]">
                Filtry
                {activeCount > 0 && (
                  <span className="ml-2 text-sm font-semibold" style={{ color: '#2E9E8F' }}>
                    ({activeCount})
                  </span>
                )}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-none cursor-pointer"
                style={{ background: '#F0EDE8', color: '#6B4030' }}>
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-4">
              {panelContent}
            </div>

            <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #F0EDE8' }}>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-lg font-bold text-sm text-white border-none cursor-pointer"
                style={{ background: '#2E9E8F' }}>
                Zobrazit výsledky ({total})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
