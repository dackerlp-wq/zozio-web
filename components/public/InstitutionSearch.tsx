'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export interface InstitutionSuggestion {
  name: string
  slug: string
  type: string
  city: string
}

interface Props {
  suggestions: InstitutionSuggestion[]
  cities:      string[]
  params:      Record<string, string | undefined>
  defaultQ?:   string
}

function buildUrl(params: any, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides, page: undefined }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/institutions${str ? `?${str}` : ''}`
}

type Item =
  | { kind: 'city';        label: string }
  | { kind: 'institution'; label: string; sub: string; slug: string }
  | { kind: 'search';      label: string }

export function InstitutionSearch({ suggestions, cities, params, defaultQ }: Props) {
  const [value,       setValue]       = useState(defaultQ ?? '')
  const [open,        setOpen]        = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef  = useRef<HTMLDivElement>(null)
  const inputRef      = useRef<HTMLInputElement>(null)
  const router        = useRouter()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const trimmed = value.trim()

  const matchedCities = trimmed.length === 0 ? [] : cities
    .filter(c => c.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 4)

  const matchedInsts = trimmed.length === 0 ? [] : suggestions
    .filter(i => i.name.toLowerCase().includes(trimmed.toLowerCase()) || i.city.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 6)

  const items: Item[] = [
    ...matchedCities.map(c => ({ kind: 'city' as const, label: c })),
    ...matchedInsts.map(i => ({
      kind:  'institution' as const,
      label: i.name,
      sub:   `${i.type === 'shelter' ? '🏠 Útulek' : '🚑 Záchranná stanice'} · ${i.city}`,
      slug:  i.slug,
    })),
    ...(trimmed.length > 0
      ? [{ kind: 'search' as const, label: trimmed }]
      : []),
  ]

  const navigate = useCallback((item: Item) => {
    setOpen(false)
    setHighlighted(-1)
    if (item.kind === 'city') {
      router.push(buildUrl(params, { city: item.label, q: undefined }))
      setValue('')
    } else if (item.kind === 'institution') {
      router.push(`/institutions/${item.slug}`)
    } else {
      router.push(buildUrl(params, { q: item.label, city: undefined }))
    }
  }, [params, router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (trimmed) router.push(buildUrl(params, { q: trimmed, city: undefined }))
        setOpen(false)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0) navigate(items[highlighted])
      else if (trimmed) router.push(buildUrl(params, { q: trimmed, city: undefined }))
      setOpen(false)
    }
  }

  const showDropdown = open && items.length > 0

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[220px]">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            autoComplete="off"
            onChange={e => { setValue(e.target.value); setOpen(true); setHighlighted(-1) }}
            onFocus={() => { if (trimmed) setOpen(true) }}
            onKeyDown={handleKeyDown}
            placeholder="Hledat název nebo město..."
            className="w-full pl-4 pr-9 py-2.5 rounded-lg border text-sm outline-none transition-colors"
            style={{
              borderColor: open && showDropdown ? '#E8634A' : '#E0DDD8',
              background: 'white',
              color: '#1A0F0A',
            }}
          />
          {value && (
            <button
              type="button"
              onClick={() => { setValue(''); setOpen(false); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm border-none bg-transparent cursor-pointer"
              style={{ color: '#8B6550' }}
              aria-label="Vymazat">
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (trimmed) router.push(buildUrl(params, { q: trimmed, city: undefined }))
            setOpen(false)
          }}
          className="px-5 py-2.5 rounded-lg font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 flex-shrink-0"
          style={{ background: '#E8634A' }}>
          Hledat
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg overflow-hidden z-50"
          style={{ border: '1.5px solid #E8634A', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>

          {matchedCities.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: '#FAFAF8', color: '#8B6550' }}>
                Města
              </div>
              {matchedCities.map((city, i) => (
                <button key={city} type="button"
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => navigate({ kind: 'city', label: city })}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2.5 border-none cursor-pointer transition-colors"
                  style={{ background: highlighted === i ? '#FAECE7' : 'white', color: '#1A0F0A' }}>
                  <span className="text-base">📍</span>
                  <span>{city}</span>
                </button>
              ))}
            </div>
          )}

          {matchedInsts.length > 0 && (
            <div>
              {matchedCities.length > 0 && (
                <div className="h-px" style={{ background: '#F0EDE8' }} />
              )}
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: '#FAFAF8', color: '#8B6550' }}>
                Instituce
              </div>
              {matchedInsts.map((inst, i) => {
                const idx = matchedCities.length + i
                return (
                  <button key={inst.slug} type="button"
                    onMouseEnter={() => setHighlighted(idx)}
                    onClick={() => navigate({ kind: 'institution', label: inst.name, sub: '', slug: inst.slug })}
                    className="w-full text-left px-4 py-2.5 border-none cursor-pointer transition-colors"
                    style={{ background: highlighted === idx ? '#FAECE7' : 'white' }}>
                    <div className="text-sm font-semibold text-[#1A0F0A]">{inst.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>
                      {inst.type === 'shelter' ? '🏠 Útulek' : '🚑 Záchranná stanice'} · {inst.city}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Vyhledat jako text */}
          {(() => {
            const idx = matchedCities.length + matchedInsts.length
            return (
              <>
                <div className="h-px" style={{ background: '#F0EDE8' }} />
                <button type="button"
                  onMouseEnter={() => setHighlighted(idx)}
                  onClick={() => navigate({ kind: 'search', label: trimmed })}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 border-none cursor-pointer transition-colors"
                  style={{ background: highlighted === idx ? '#FAECE7' : 'white', color: '#6B4030' }}>
                  <span>🔍</span>
                  <span>Hledat <strong className="text-[#1A0F0A]">„{trimmed}"</strong> ve všech institucích</span>
                </button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
