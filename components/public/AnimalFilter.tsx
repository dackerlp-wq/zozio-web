'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface AnimalFilterProps {
  species:  { id: string; name_cs: string; icon: string | null }[]
  breeds:   string[]
  cityList: { name: string; lat: number; lng: number }[]
  params:   Record<string, string | undefined>
  total:    number
  adSlot?:  React.ReactNode
}

function Divider() {
  return <div className="h-px my-4" style={{ background: '#F0EDE8' }} />
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8B6550' }}>
      {children}
    </span>
  )
}

export function AnimalFilter({ species, breeds, cityList, params, total, adSlot }: AnimalFilterProps) {
  const router   = useRouter()
  const pathname = usePathname()

  const [q, setQ]                       = useState(params.q ?? '')
  const [suggestions, setSuggestions]   = useState<{ id: string; label: string; sub: string; icon: string | null }[]>([])
  const [showSugg, setShowSugg]         = useState(false)
  const [breedSearch, setBreedSearch]   = useState('')
  const [citySugg, setCitySugg]         = useState<{ name: string; lat: number; lng: number }[]>([])
  const [showCitySugg, setShowCitySugg] = useState(false)
  const [gpsLoading, setGpsLoading]     = useState(false)
  const [drawerOpen, setDrawerOpen]     = useState(false)

  const searchRef    = useRef<HTMLDivElement>(null)
  const cityRef      = useRef<HTMLDivElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // Sync city input on param change
  useEffect(() => {
    if (cityInputRef.current) cityInputRef.current.value = params.city ?? ''
  }, [params.city])

  const buildUrl = useCallback((overrides: Record<string, string | undefined>) => {
    const next = { ...params, ...overrides, page: undefined }
    const qs   = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v) })
    const str = qs.toString()
    return `${pathname}${str ? `?${str}` : ''}`
  }, [params, pathname])

  const setFilter    = (key: string, value: string | undefined) => router.push(buildUrl({ [key]: value }))
  const toggleFilter = (key: string, value: string) => setFilter(key, params[key] === value ? undefined : value)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSugg(false)
    router.push(buildUrl({ q: q.trim() || undefined }))
  }

  const clearAll = () => {
    setQ('')
    if (cityInputRef.current) cityInputRef.current.value = ''
    router.push(pathname)
    setDrawerOpen(false)
  }

  // Autocomplete
  useEffect(() => {
    if (!q || q.length < 2) { setSuggestions([]); setShowSugg(false); return }
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q })
        if (params.species) qs.set('species', params.species)
        const res = await fetch(`/api/public/animals/suggest?${qs}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
          setShowSugg(data.length > 0)
        }
      } catch {}
    }, 280)
    return () => clearTimeout(t)
  }, [q, params.species])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSugg(false)
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCitySugg(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCityInput = (val: string) => {
    if (val.trim().length < 1) { setCitySugg([]); setShowCitySugg(false); return }
    const matches = cityList.filter(c => c.name.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8)
    setCitySugg(matches)
    setShowCitySugg(matches.length > 0)
  }

  const selectCity = (city: { name: string; lat: number; lng: number }) => {
    if (cityInputRef.current) cityInputRef.current.value = city.name
    setShowCitySugg(false)
    router.push(buildUrl({ city: city.name, lat: String(city.lat), lng: String(city.lng) }))
  }

  const handleGPS = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'cs' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          if (city) {
            if (cityInputRef.current) cityInputRef.current.value = city
            router.push(buildUrl({ city, lat: String(lat), lng: String(lng) }))
          }
        } catch {}
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { timeout: 8000 }
    )
  }

  const activeCount = [
    params.q, params.species, params.breed, params.city, params.size, params.urgent,
    params.housing, params.kids, params.other_animals, params.activity, params.difficulty,
    params.sex, params.age,
  ].filter(Boolean).length

  // ── Chip styles ───────────────────────────────────────────────────────
  const chipCls = (active: boolean) =>
    `inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all min-h-[40px] ${
      active
        ? 'border-[#E8634A] text-[#993C1D] bg-[#FAECE7]'
        : 'border-[#F0EDE8] text-[#6B4030] bg-white hover:border-[#E8634A]/40'
    }`

  const toggleChip = (key: string, value: string, label: string) => {
    const isActive = params[key] === value
    return (
      <button key={value} onClick={() => toggleFilter(key, value)} className={chipCls(isActive)}>
        {label}{isActive && <span className="ml-0.5 text-[10px]">✓</span>}
      </button>
    )
  }

  const yesNoRow = (key: string, yesLabel: string, noLabel: string) => (
    <div className="flex gap-2">
      <button
        onClick={() => toggleFilter(key, 'yes')}
        className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
        style={params[key] === 'yes'
          ? { background: '#EAF3DE', borderColor: '#BDE8D0', color: '#1D6A42' }
          : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
        {yesLabel}
      </button>
      <button
        onClick={() => toggleFilter(key, 'no')}
        className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
        style={params[key] === 'no'
          ? { background: '#FAECE7', borderColor: '#F5C4B3', color: '#993C1D' }
          : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
        {noLabel}
      </button>
      <button
        onClick={() => setFilter(key, undefined)}
        className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
        style={!params[key]
          ? { background: '#FAECE7', borderColor: '#E8634A', color: '#993C1D' }
          : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
        Nezáleží
      </button>
    </div>
  )

  const filteredBreeds = breedSearch.trim().length > 0
    ? breeds.filter(b => b.toLowerCase().includes(breedSearch.toLowerCase()))
    : breeds

  // ── Filter content (shared between desktop sidebar and mobile drawer) ─
  const filterContent = (
    <div className="space-y-0">

      {/* Search */}
      <div ref={searchRef} className="relative mb-4">
        <form onSubmit={handleSearch}>
          <div className="flex items-center border rounded-lg overflow-hidden"
            style={{ borderColor: '#E0DDD8', background: '#FAFAF8' }}>
            <input
              type="text" value={q}
              onChange={e => setQ(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSugg(true)}
              placeholder="Hledat jméno, plemeno..."
              className="flex-1 min-w-0 px-3 py-2.5 text-sm outline-none bg-transparent min-h-[44px]"
              style={{ color: '#1A0F0A' }}
              autoComplete="off"
            />
            <button type="submit"
              className="flex items-center justify-center px-4 py-2.5 text-white border-none cursor-pointer hover:opacity-90 flex-shrink-0 min-h-[44px]"
              style={{ background: '#E8634A' }}>
              <svg width="16" height="16" viewBox="-1 -1 16 16" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </form>
        {showSugg && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0DDD8] rounded-lg shadow-lg z-50 overflow-hidden">
            {suggestions.map(s => (
              <Link key={s.id} href={`/animals/${s.id}`}
                onClick={() => { setShowSugg(false); setDrawerOpen(false) }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAFAF8] no-underline border-b border-[#F5F2EE] last:border-0">
                <span className="text-xl flex-shrink-0">{s.icon ?? '🐾'}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A0F0A] truncate">{s.label}</div>
                  {s.sub && <div className="text-xs truncate" style={{ color: '#8B6550' }}>{s.sub}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Urgentní */}
      <button
        onClick={() => toggleFilter('urgent', 'true')}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border text-sm font-semibold cursor-pointer transition-all mb-4 min-h-[48px]"
        style={params.urgent === 'true'
          ? { background: '#FAECE7', borderColor: '#E8634A', color: '#993C1D' }
          : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
        <span>🆘</span>
        Urgentní adopce
        {params.urgent === 'true' && <span className="ml-auto text-[10px] font-bold">✓ Aktivní</span>}
      </button>

      <Divider />

      {/* Druh zvířete */}
      <div>
        <Label>Druh zvířete</Label>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilter('species', undefined)} className={chipCls(!params.species)}>
            Všechna
          </button>
          {species.map(s => (
            <button key={s.id} onClick={() => { setFilter('species', params.species === s.id ? undefined : s.id); setBreedSearch('') }} className={chipCls(params.species === s.id)}>
              {s.icon && <span>{s.icon}</span>}{s.name_cs}
            </button>
          ))}
        </div>
      </div>

      {/* Rasa / Plemeno */}
      {breeds.length > 0 && (
        <>
          <Divider />
          <div>
            <Label>Rasa / Plemeno</Label>
            {breeds.length > 5 && (
              <input
                type="text"
                value={breedSearch}
                onChange={e => setBreedSearch(e.target.value)}
                placeholder="Filtrovat rasy..."
                className="w-full px-3 py-2 text-xs rounded-lg border outline-none mb-2 min-h-[40px]"
                style={{ borderColor: '#E0DDD8', color: '#1A0F0A', background: '#FAFAF8' }}
              />
            )}
            <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto pr-1">
              <button
                onClick={() => setFilter('breed', undefined)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all min-h-[36px] ${!params.breed ? 'text-[#993C1D] bg-[#FAECE7]' : 'text-[#6B4030] hover:bg-[#FAFAF8]'}`}>
                Jakékoliv plemeno
              </button>
              {filteredBreeds.map(b => (
                <button key={b}
                  onClick={() => setFilter('breed', params.breed === b ? undefined : b)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all min-h-[36px] ${params.breed === b ? 'text-[#993C1D] bg-[#FAECE7]' : 'text-[#6B4030] hover:bg-[#FAFAF8]'}`}>
                  {b}
                </button>
              ))}
              {filteredBreeds.length === 0 && breedSearch && (
                <p className="text-xs px-3 py-2" style={{ color: '#8B6550' }}>Žádné plemeno nenalezeno</p>
              )}
            </div>
          </div>
        </>
      )}

      <Divider />

      {/* Pohlaví */}
      <div>
        <Label>Pohlaví</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('sex', undefined)}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
            style={!params.sex
              ? { background: '#FAECE7', borderColor: '#E8634A', color: '#993C1D' }
              : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
            Nezáleží
          </button>
          <button
            onClick={() => toggleFilter('sex', 'male')}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
            style={params.sex === 'male'
              ? { background: '#E6F1FB', borderColor: '#4A9EE0', color: '#185FA5' }
              : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
            ♂ Samec
          </button>
          <button
            onClick={() => toggleFilter('sex', 'female')}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
            style={params.sex === 'female'
              ? { background: '#FDE8F3', borderColor: '#E040A0', color: '#B01060' }
              : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
            ♀ Samice
          </button>
        </div>
      </div>

      <Divider />

      {/* Věk */}
      <div>
        <Label>Věk</Label>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilter('age', undefined)} className={chipCls(!params.age)}>Jakýkoliv</button>
          <button onClick={() => toggleFilter('age', 'young')}  className={chipCls(params.age === 'young')}>🐣 Do 2 let</button>
          <button onClick={() => toggleFilter('age', 'adult')}  className={chipCls(params.age === 'adult')}>🐕 2–8 let</button>
          <button onClick={() => toggleFilter('age', 'senior')} className={chipCls(params.age === 'senior')}>🦮 Senior 8+</button>
        </div>
      </div>

      <Divider />

      {/* Velikost */}
      <div>
        <Label>Velikost</Label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: undefined, label: 'Jakákoliv' },
            { value: 'small',   label: '🐾 Malý' },
            { value: 'medium',  label: '🐕 Střední' },
            { value: 'large',   label: '🐕‍🦺 Velký' },
            { value: 'xlarge',  label: '🦣 Extra velký' },
          ].map(({ value, label }) => (
            <button key={label}
              onClick={() => setFilter('size', params.size === value ? undefined : value)}
              className={chipCls(!value ? !params.size : params.size === value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Vhodný pro */}
      <div>
        <Label>Vhodný pro</Label>
        <div className="flex gap-2">
          <button
            onClick={() => toggleFilter('housing', 'flat')}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
            style={params.housing === 'flat'
              ? { background: '#FAECE7', borderColor: '#E8634A', color: '#993C1D' }
              : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
            🏢 Byt
          </button>
          <button
            onClick={() => toggleFilter('housing', 'house')}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center min-h-[44px]"
            style={params.housing === 'house'
              ? { background: '#FAECE7', borderColor: '#E8634A', color: '#993C1D' }
              : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
            🏡 Dům / zahrada
          </button>
        </div>
      </div>

      <Divider />

      {/* Kompatibilita */}
      <div>
        <Label>Kompatibilita</Label>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-medium mb-1.5" style={{ color: '#8B6550' }}>S dětmi</p>
            {yesNoRow('kids', '✓ Vhodný', '✗ Nevhodný')}
          </div>
          <div>
            <p className="text-[10px] font-medium mb-1.5" style={{ color: '#8B6550' }}>S jinými zvířaty</p>
            {yesNoRow('other_animals', '✓ Vhodný', '✗ Nevhodný')}
          </div>
        </div>
      </div>

      <Divider />

      {/* Aktivita */}
      <div>
        <Label>Úroveň aktivity</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 'low',       icon: '😴', label: 'Nízká',        sub: 'Klidná povaha' },
            { value: 'medium',    icon: '🚶', label: 'Střední',       sub: 'Denní vycházky' },
            { value: 'high',      icon: '🏃', label: 'Vysoká',        sub: 'Sport a pohyb' },
            { value: 'very_high', icon: '⚡', label: 'Velmi vysoká',  sub: 'Intenzivní sport' },
          ].map(({ value, icon, label, sub }) => (
            <button key={value} onClick={() => toggleFilter('activity', value)}
              className="text-left p-2.5 rounded-lg border cursor-pointer transition-all min-h-[56px]"
              style={params.activity === value
                ? { background: '#FAECE7', borderColor: '#E8634A' }
                : { background: 'white', borderColor: '#F0EDE8' }}>
              <div className="text-xs font-bold" style={{ color: params.activity === value ? '#993C1D' : '#1A0F0A' }}>
                {icon} {label}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#8B6550' }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Náročnost chovu */}
      <div>
        <Label>Náročnost chovu</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 'easy',      label: '⭐ Nenáročný',      sub: 'Pro začátečníky' },
            { value: 'medium',    label: '⭐⭐ Střední',       sub: 'Mírná zkušenost' },
            { value: 'demanding', label: '⭐⭐⭐ Náročný',     sub: 'Pro zkušené' },
            { value: 'expert',    label: '⭐⭐⭐⭐ Expert',    sub: 'Odborná péče' },
          ].map(({ value, label, sub }) => (
            <button key={value} onClick={() => toggleFilter('difficulty', value)}
              className="text-left p-2.5 rounded-lg border cursor-pointer transition-all min-h-[56px]"
              style={params.difficulty === value
                ? { background: '#FAECE7', borderColor: '#E8634A' }
                : { background: 'white', borderColor: '#F0EDE8' }}>
              <div className="text-xs font-bold" style={{ color: params.difficulty === value ? '#993C1D' : '#1A0F0A' }}>
                {label}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#8B6550' }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Poloha */}
      <div>
        <Label>Poloha</Label>
        <div ref={cityRef} className="relative mb-2">
          <div className="flex gap-2">
            <input
              ref={cityInputRef}
              type="text"
              defaultValue={params.city ?? ''}
              autoComplete="off"
              onChange={e => handleCityInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); if (citySugg.length > 0) selectCity(citySugg[0]) }
                if (e.key === 'Escape') setShowCitySugg(false)
              }}
              onFocus={() => citySugg.length > 0 && setShowCitySugg(true)}
              placeholder="Zadej město..."
              className="flex-1 px-3 py-2.5 text-xs rounded-lg border outline-none min-h-[44px]"
              style={{ borderColor: '#E0DDD8', color: '#1A0F0A', background: '#FAFAF8', minWidth: 0 }}
            />
            <button
              onClick={handleGPS}
              disabled={gpsLoading}
              title="Zjistit moji polohu"
              className="w-11 h-11 rounded-lg flex items-center justify-center border cursor-pointer transition-all flex-shrink-0 disabled:opacity-50"
              style={{ borderColor: '#E0DDD8', background: 'white', color: '#6B4030' }}>
              {gpsLoading ? <span className="text-[10px]">...</span> : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
          {showCitySugg && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0DDD8] rounded-lg shadow-lg z-50 overflow-hidden">
              {citySugg.map(c => (
                <button key={c.name}
                  onMouseDown={e => { e.preventDefault(); selectCity(c) }}
                  className="w-full text-left px-3 py-2.5 text-xs font-medium hover:bg-[#FAFAF8] border-b border-[#F5F2EE] last:border-0 cursor-pointer min-h-[44px]"
                  style={{ color: '#1A0F0A' }}>
                  📍 {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {params.city && (
          <button
            onClick={() => {
              if (cityInputRef.current) cityInputRef.current.value = ''
              setCitySugg([]); setShowCitySugg(false)
              router.push(buildUrl({ city: undefined, lat: undefined, lng: undefined }))
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border min-h-[44px]"
            style={{ background: '#FAECE7', borderColor: '#E8634A', color: '#993C1D' }}>
            <span>📍 {params.city}</span>
            <span>× Zrušit</span>
          </button>
        )}
      </div>

      {/* Zrušit filtry */}
      {activeCount > 0 && (
        <>
          <Divider />
          <button onClick={clearAll}
            className="w-full py-3 rounded-lg text-sm font-bold cursor-pointer border-none transition-all hover:opacity-80 min-h-[48px]"
            style={{ background: '#F0EDE8', color: '#6B4030' }}>
            Zrušit všechny filtry ({activeCount})
          </button>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white rounded-xl border border-[#F0EDE8] p-4">
          {filterContent}
        </div>
        {adSlot && <div className="mt-4">{adSlot}</div>}
      </div>

      {/* ── Mobile: fixed floating pill button ── */}
      <div className="lg:hidden">
        {/* Floating pill — fixed at bottom center */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <button
            onClick={() => setDrawerOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-sm text-white"
            style={{
              background: activeCount > 0 ? '#E8634A' : '#2C1810',
              boxShadow: '0 6px 28px rgba(44,24,16,0.35)',
            }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {activeCount > 0 ? `Filtry · ${activeCount}` : 'Filtry'}
          </button>
        </div>

        {/* Active filter chips — inline above results */}
        {activeCount > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {params.urgent    && <ActiveChip label="🆘 Urgentní"      onRemove={() => setFilter('urgent', undefined)} />}
            {params.species   && <ActiveChip label={species.find(s => s.id === params.species)?.name_cs ?? 'Druh'} onRemove={() => setFilter('species', undefined)} />}
            {params.breed     && <ActiveChip label={params.breed}     onRemove={() => setFilter('breed', undefined)} />}
            {params.sex === 'male'   && <ActiveChip label="♂ Samec"   onRemove={() => setFilter('sex', undefined)} />}
            {params.sex === 'female' && <ActiveChip label="♀ Samice"  onRemove={() => setFilter('sex', undefined)} />}
            {params.age === 'young'  && <ActiveChip label="🐣 Do 2 let"   onRemove={() => setFilter('age', undefined)} />}
            {params.age === 'adult'  && <ActiveChip label="🐕 2–8 let"    onRemove={() => setFilter('age', undefined)} />}
            {params.age === 'senior' && <ActiveChip label="🦮 Senior 8+"  onRemove={() => setFilter('age', undefined)} />}
            {params.size      && <ActiveChip label={`Velikost: ${params.size}`} onRemove={() => setFilter('size', undefined)} />}
            {params.housing === 'flat'  && <ActiveChip label="🏢 Byt"  onRemove={() => setFilter('housing', undefined)} />}
            {params.housing === 'house' && <ActiveChip label="🏡 Dům"  onRemove={() => setFilter('housing', undefined)} />}
            {params.kids === 'yes'   && <ActiveChip label="✓ S dětmi"      onRemove={() => setFilter('kids', undefined)} />}
            {params.kids === 'no'    && <ActiveChip label="✗ Bez dětí"     onRemove={() => setFilter('kids', undefined)} />}
            {params.other_animals === 'yes' && <ActiveChip label="✓ Se zvířaty" onRemove={() => setFilter('other_animals', undefined)} />}
            {params.other_animals === 'no'  && <ActiveChip label="✗ Bez zvířat" onRemove={() => setFilter('other_animals', undefined)} />}
            {params.city      && <ActiveChip label={`📍 ${params.city}`}  onRemove={() => { if (cityInputRef.current) cityInputRef.current.value = ''; router.push(buildUrl({ city: undefined, lat: undefined, lng: undefined })) }} />}
          </div>
        )}
      </div>

      {/* ── Mobile bottom drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
            style={{
              borderRadius: '20px 20px 0 0',
              maxHeight: '92dvh',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
            }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: '#F0EDE8' }}>
              <span className="font-bold text-base" style={{ color: '#1A0F0A' }}>
                Filtry {activeCount > 0 && <span className="text-sm font-normal" style={{ color: '#E8634A' }}>({activeCount} aktivních)</span>}
              </span>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button onClick={clearAll} className="text-xs font-semibold" style={{ color: '#E8634A' }}>
                    Zrušit vše
                  </button>
                )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-none cursor-pointer"
                  style={{ background: '#F0EDE8', color: '#6B4030' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {filterContent}
            </div>

            {/* Sticky footer CTA */}
            <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: '#F0EDE8', background: 'white' }}>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-4 rounded-xl text-white font-bold text-base border-none cursor-pointer min-h-[56px]"
                style={{ background: '#E8634A' }}>
                Zobrazit {total} zvířat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: '#FAECE7', color: '#993C1D', border: '1px solid #F5C4B3' }}>
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold border-none cursor-pointer"
        style={{ background: 'rgba(232,99,74,0.2)', color: '#993C1D' }}>
        ✕
      </button>
    </span>
  )
}
