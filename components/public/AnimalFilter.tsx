'use client'
import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'

interface AnimalFilterProps {
  species: { id: string; name_cs: string; icon: string | null }[]
  cities:  string[]
  params:  Record<string, string | undefined>
  total:   number
}

export function AnimalFilter({ species, cities, params, total }: AnimalFilterProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [q, setQ]               = useState(params.q ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)

  const buildUrl = useCallback((overrides: Record<string, string | undefined>) => {
    const next = { ...params, ...overrides, page: undefined }
    const qs   = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v) })
    const str = qs.toString()
    return `${pathname}${str ? `?${str}` : ''}`
  }, [params, pathname])

  const setFilter = (key: string, value: string | undefined) =>
    router.push(buildUrl({ [key]: value }))

  const toggleFilter = (key: string, value: string) =>
    setFilter(key, params[key] === value ? undefined : value)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(buildUrl({ q: q.trim() || undefined }))
  }

  const clearAll = () => { setQ(''); router.push(pathname) }

  const activeCount = [
    params.q, params.species, params.city, params.size, params.urgent,
    params.housing, params.kids, params.other_animals,
    params.activity, params.difficulty,
  ].filter(Boolean).length

  // Styly
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all
    ${active
      ? 'border-coral text-coral-tag-text bg-coral-tag-bg'
      : 'border-border text-text-body bg-white hover:border-coral/40'}`

  const yesNoChip = (key: string, value: string, label: string, activeClassName?: string) => {
    const isActive = params[key] === value
    return (
      <button onClick={() => toggleFilter(key, value)}
        className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center ${
          isActive
            ? (activeClassName ?? 'bg-coral-tag-bg border-coral text-coral-tag-text')
            : 'bg-white border-border text-text-body'
        }`}>
        {label}
      </button>
    )
  }

  const divider = <div className="h-px bg-border my-4" />

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text-muted">
        {title}
      </span>
      {children}
    </div>
  )

  const filterPanel = (
    <div className="bg-white rounded-2xl border border-border p-4">

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex items-center gap-0 border rounded-lg overflow-hidden border-border bg-warm-hover">
          <input
            type="search" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Jméno, plemeno..."
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent text-text-primary"
            style={{ minWidth: 0 }}
          />
          <button type="submit"
            className="px-3 py-2 text-white text-sm border-none cursor-pointer hover:opacity-90 flex-shrink-0 bg-coral">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </form>

      {divider}

      {/* Urgentní */}
      <button
        onClick={() => toggleFilter('urgent', 'true')}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all mb-4 ${
          params.urgent === 'true'
            ? 'bg-coral-tag-bg border-coral text-coral-tag-text'
            : 'bg-white border-border text-text-body'
        }`}>
        <span>🆘</span>
        Urgentní adopce
        {params.urgent === 'true' && <span className="ml-auto text-[10px]">✓</span>}
      </button>

      {divider}

      {/* Druh */}
      <Section title="Druh zvířete">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilter('species', undefined)} className={chip(!params.species)}>
            Všechna
          </button>
          {species.map(s => (
            <button key={s.id} onClick={() => toggleFilter('species', s.id)} className={chip(params.species === s.id)}>
              {s.icon && <span>{s.icon}</span>}{s.name_cs}
            </button>
          ))}
        </div>
      </Section>

      {divider}

      {/* Bydlení */}
      <Section title="Vhodný pro">
        <div className="flex gap-2">
          <button onClick={() => toggleFilter('housing', 'flat')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center ${
              params.housing === 'flat'
                ? 'bg-coral-tag-bg border-coral text-coral-tag-text'
                : 'bg-white border-border text-text-body'
            }`}>
            🏢 Byt
          </button>
          <button onClick={() => toggleFilter('housing', 'house')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center ${
              params.housing === 'house'
                ? 'bg-coral-tag-bg border-coral text-coral-tag-text'
                : 'bg-white border-border text-text-body'
            }`}>
            🏡 Dům/zahrada
          </button>
        </div>
      </Section>

      {divider}

      {/* Kompatibilita */}
      <Section title="Kompatibilita">
        <div className="space-y-2">
          {/* Děti */}
          <div>
            <div className="text-[10px] font-medium mb-1.5 text-text-muted">S dětmi</div>
            <div className="flex gap-2">
              {yesNoChip('kids', 'yes', '✓ Ano', 'bg-success-tag-bg border-[#BDE8D0] text-[#1D6A42]')}
              {yesNoChip('kids', 'no',  '✗ Ne',  'bg-coral-tag-bg border-[#F5C4B3] text-coral-tag-text')}
              {yesNoChip('kids', 'any', 'Nezáleží')}
            </div>
          </div>

          {/* Jiná zvířata */}
          <div>
            <div className="text-[10px] font-medium mb-1.5 text-text-muted">S jinými zvířaty</div>
            <div className="flex gap-2">
              {yesNoChip('other_animals', 'yes', '✓ Ano', 'bg-success-tag-bg border-[#BDE8D0] text-[#1D6A42]')}
              {yesNoChip('other_animals', 'no',  '✗ Ne',  'bg-coral-tag-bg border-[#F5C4B3] text-coral-tag-text')}
              {yesNoChip('other_animals', 'any', 'Nezáleží')}
            </div>
          </div>
        </div>
      </Section>

      {divider}

      {/* Aktivita */}
      <Section title="Úroveň aktivity">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 'low',       label: '😴 Nízká',        sub: 'Klidná povaha' },
            { value: 'medium',    label: '🚶 Střední',       sub: 'Denní vycházky' },
            { value: 'high',      label: '🏃 Vysoká',        sub: 'Sport a pohyb' },
            { value: 'very_high', label: '⚡ Velmi vysoká',  sub: 'Intenzivní sport' },
          ].map(({ value, label, sub }) => (
            <button key={value} onClick={() => toggleFilter('activity', value)}
              className={`text-left p-2.5 rounded-xl border cursor-pointer transition-all ${
                params.activity === value
                  ? 'bg-coral-tag-bg border-coral'
                  : 'bg-white border-border'
              }`}>
              <div className={`text-xs font-bold ${params.activity === value ? 'text-coral-tag-text' : 'text-text-primary'}`}>
                {label}
              </div>
              <div className="text-[10px] mt-0.5 text-text-muted">{sub}</div>
            </button>
          ))}
        </div>
      </Section>

      {divider}

      {/* Náročnost chovu */}
      <Section title="Náročnost chovu">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 'easy',      label: '⭐ Nenáročný',    sub: 'Pro začátečníky' },
            { value: 'medium',    label: '⭐⭐ Střední',     sub: 'Mírná zkušenost' },
            { value: 'demanding', label: '⭐⭐⭐ Náročný',   sub: 'Pro zkušené' },
            { value: 'expert',    label: '⭐⭐⭐⭐ Expert',  sub: 'Odborná péče' },
          ].map(({ value, label, sub }) => (
            <button key={value} onClick={() => toggleFilter('difficulty', value)}
              className={`text-left p-2.5 rounded-xl border cursor-pointer transition-all ${
                params.difficulty === value
                  ? 'bg-coral-tag-bg border-coral'
                  : 'bg-white border-border'
              }`}>
              <div className={`text-xs font-bold ${params.difficulty === value ? 'text-coral-tag-text' : 'text-text-primary'}`}>
                {label}
              </div>
              <div className="text-[10px] mt-0.5 text-text-muted">{sub}</div>
            </button>
          ))}
        </div>
      </Section>

      {divider}

      {/* Velikost */}
      <Section title="Velikost">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: undefined,  label: 'Jakákoliv' },
            { value: 'small',    label: 'Malý' },
            { value: 'medium',   label: 'Střední' },
            { value: 'large',    label: 'Velký' },
            { value: 'xlarge',   label: 'Extra velký' },
          ].map(({ value, label }) => (
            <button key={label}
              onClick={() => setFilter('size', params.size === value ? undefined : value)}
              className={chip(!value ? !params.size : params.size === value)}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      {divider}

      {/* Město */}
      {cities.length > 0 && (
        <Section title="Město">
          <div className="flex flex-col gap-0.5">
            <button onClick={() => setFilter('city', undefined)}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                ${!params.city ? 'text-coral-tag-text bg-coral-tag-bg' : 'text-text-body hover:bg-warm-hover'}`}>
              Celá ČR a SR
            </button>
            {cities.map(city => (
              <button key={city} onClick={() => setFilter('city', params.city === city ? undefined : city)}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                  ${params.city === city ? 'text-coral-tag-text bg-coral-tag-bg' : 'text-text-body hover:bg-warm-hover'}`}>
                {city}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Zrušit filtry */}
      {activeCount > 0 && (
        <>
          {divider}
          <button onClick={clearAll}
            className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none transition-all hover:opacity-80 bg-border text-text-body">
            Zrušit všechny filtry ({activeCount})
          </button>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-24">
        {filterPanel}
      </div>

      {/* Mobilní collapsible */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border font-semibold text-sm cursor-pointer transition-all bg-white border-[#E0DDD8] text-text-primary"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Filtry
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-coral">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-text-muted">{mobileOpen ? '↑' : '↓'}</span>
        </button>
        {mobileOpen && <div className="mt-2">{filterPanel}</div>}
      </div>
    </>
  )
}
