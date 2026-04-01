'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface RescueFilterProps {
  species: { id: string; name_cs: string; icon: string | null }[]
  cities:  string[]
  params:  Record<string, string | undefined>
}

function buildUrl(params: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides, page: undefined }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/rescue${str ? `?${str}` : ''}`
}

export function RescueFilter({ species, cities, params }: RescueFilterProps) {
  const activeCount = [params.species, params.status, params.city].filter(Boolean).length

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all
    ${active
      ? 'border-rescue text-rescue-tag-text bg-rescue-tag-bg'
      : 'border-border text-text-body bg-white hover:border-rescue/40'}`

  const divider = <div className="h-px bg-border my-4" />

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text-muted">
        {title}
      </span>
      {children}
    </div>
  )

  const panel = (
    <div className="bg-white rounded-2xl border border-border p-4">

      {/* Stav léčby */}
      <Section title="Stav léčby">
        <div className="flex flex-wrap gap-1.5">
          <Link href={buildUrl(params, { status: undefined })} className={`${chip(!params.status)} no-underline`}>
            Všechny
          </Link>
          {[
            { value: 'intake',         label: '🚑 Příjem' },
            { value: 'treatment',      label: '🩺 Léčba' },
            { value: 'rehabilitation', label: '💪 Rehabilitace' },
            { value: 'released',       label: '🌿 Propuštěno' },
          ].map(({ value, label }) => (
            <Link key={value}
              href={buildUrl(params, { status: params.status === value ? undefined : value })}
              className={`${chip(params.status === value)} no-underline`}>
              {label}
            </Link>
          ))}
        </div>
      </Section>

      {/* Druh */}
      {species.length > 0 && (
        <>
          {divider}
          <Section title="Druh zvířete">
            <div className="flex flex-wrap gap-1.5">
              <Link href={buildUrl(params, { species: undefined })} className={`${chip(!params.species)} no-underline`}>
                Všechna
              </Link>
              {species.map(s => (
                <Link key={s.id}
                  href={buildUrl(params, { species: params.species === s.id ? undefined : s.id })}
                  className={`${chip(params.species === s.id)} no-underline`}>
                  {s.icon && <span>{s.icon}</span>}{s.name_cs}
                </Link>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Město */}
      {cities.length > 0 && (
        <>
          {divider}
          <Section title="Město">
            <div className="flex flex-col gap-0.5">
              <Link href={buildUrl(params, { city: undefined })}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-all
                  ${!params.city ? 'text-rescue-tag-text bg-rescue-tag-bg' : 'text-text-body hover:bg-warm-hover'}`}>
                Celá ČR a SR
              </Link>
              {cities.map(city => (
                <Link key={city}
                  href={buildUrl(params, { city: params.city === city ? undefined : city })}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-all
                    ${params.city === city ? 'text-rescue-tag-text bg-rescue-tag-bg' : 'text-text-body hover:bg-warm-hover'}`}>
                  {city}
                </Link>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Zrušit */}
      {activeCount > 0 && (
        <>
          {divider}
          <Link href="/rescue" className="block w-full py-2.5 rounded-xl text-xs font-bold text-center no-underline hover:opacity-80 transition-all bg-border text-text-body">
            Zrušit filtry ({activeCount})
          </Link>
        </>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden lg:block sticky top-24">{panel}</div>
      <div className="lg:hidden">
        <details className="group">
          <summary className="flex items-center justify-between px-4 py-3 rounded-xl border font-semibold text-sm cursor-pointer list-none bg-white border-[#E0DDD8] text-text-primary">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filtry
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-rescue">{activeCount}</span>
              )}
            </span>
            <span className="text-text-muted group-open:rotate-180 transition-transform">↓</span>
          </summary>
          <div className="mt-2">{panel}</div>
        </details>
      </div>
    </>
  )
}
