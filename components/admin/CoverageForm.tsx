'use client'
import { useState, useRef, useEffect } from 'react'
import { searchCzechPlaces, type CzechPlace } from '@/lib/czech-places'

interface CoverageFormProps {
  institutionName: string
  initialCities:   string[]
}

const TYPE_LABEL: Record<CzechPlace['type'], string> = {
  region:   'Kraj',
  district: 'Okres',
  city:     'Město',
}
const TYPE_COLOR: Record<CzechPlace['type'], { bg: string; color: string }> = {
  region:   { bg: '#EDE9FE', color: '#5B21B6' },
  district: { bg: '#DBEAFE', color: '#1D4ED8' },
  city:     { bg: '#EAF3DE', color: '#3B6D11' },
}

export function CoverageForm({ institutionName, initialCities }: CoverageFormProps) {
  const [cities,      setCities]      = useState<string[]>(initialCities)
  const [input,       setInput]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState('')
  const [suggestions, setSuggestions] = useState<CzechPlace[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [activeIdx,   setActiveIdx]   = useState(-1)
  const inputRef  = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = input.trim()
    // Suggest only for the last segment when typing comma-separated values
    const last = trimmed.split(/[,;]+/).pop()?.trim() ?? ''
    if (last.length < 1) { setSuggestions([]); return }
    setSuggestions(searchCzechPlaces(last, 8))
    setActiveIdx(-1)
  }, [input])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggest(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addCity = (nameOverride?: string) => {
    const raw = nameOverride ?? input.trim()
    if (!raw) return
    const newCities = raw
      .split(/[,;]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0 && !cities.includes(c))
    if (!newCities.length) { setInput(''); setShowSuggest(false); return }
    setCities(prev => [...prev, ...newCities])
    setInput('')
    setSuggestions([])
    setShowSuggest(false)
    setSaved(false)
  }

  const pickSuggestion = (place: CzechPlace) => {
    // Replace last segment with the suggestion name
    const parts = input.split(/([,;]+)/)
    parts[parts.length - 1] = ''
    const prefix = parts.join('').replace(/[,;\s]+$/, '')
    const full   = prefix ? `${prefix}, ${place.name}` : place.name
    if (!cities.includes(place.name)) {
      setCities(prev => [...prev, place.name])
      setInput('')
    } else {
      setInput(full)
    }
    setSuggestions([])
    setShowSuggest(false)
    inputRef.current?.focus()
    setSaved(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        pickSuggestion(suggestions[activeIdx])
      } else {
        addCity()
      }
    } else if (e.key === 'Escape') {
      setShowSuggest(false)
    }
  }

  const removeCity = (city: string) => {
    setCities(prev => prev.filter(c => c !== city))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/coverage', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ coverage_cities: cities }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Chyba ukládání')
      setSaved(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const getCityStyle = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.startsWith('kraj ') || lower.endsWith(' kraj') || lower === 'hlavní město praha') {
      return TYPE_COLOR.region
    }
    if (lower.startsWith('okres ')) return TYPE_COLOR.district
    return TYPE_COLOR.city
  }

  const getCityLabel = (name: string): string | null => {
    const lower = name.toLowerCase()
    if (lower.startsWith('kraj ') || lower.endsWith(' kraj') || lower === 'hlavní město praha') return 'kraj'
    if (lower.startsWith('okres ')) return 'okres'
    return null
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm mb-6" style={{ color: '#6B4030' }}>
        Zadej města, okresy nebo kraje, odkud přijímáš zvířata do <strong>{institutionName}</strong>.
        Tato informace se zobrazí na mapě jako oblast dosahu.
      </p>

      {/* Přidat místo */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-[#1A0F0A] mb-2">
          Přidat město / okres / kraj
        </label>
        <div className="flex gap-2 relative">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)}
              onKeyDown={handleKeyDown}
              placeholder="Praha, Okres Kladno, Středočeský kraj..."
              className="w-full px-3 py-2.5 rounded-lg border border-[#E0DDD8] text-sm focus:outline-none focus:border-[#E8634A]"
            />
            {/* Dropdown */}
            {showSuggest && suggestions.length > 0 && (
              <div ref={dropdownRef}
                className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E0DDD8] rounded-lg shadow-lg z-50 overflow-hidden">
                {suggestions.map((place, idx) => {
                  const col = TYPE_COLOR[place.type]
                  return (
                    <button key={place.name} type="button"
                      onMouseDown={e => { e.preventDefault(); pickSuggestion(place) }}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 border-none cursor-pointer transition-colors"
                      style={{ background: idx === activeIdx ? '#F5F3F0' : 'white' }}>
                      <span className="flex-1 font-semibold text-[#1A0F0A]">{place.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: col.bg, color: col.color }}>
                        {TYPE_LABEL[place.type]}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => addCity()}
            className="px-4 py-2.5 rounded-lg font-bold text-sm text-white border-none cursor-pointer hover:opacity-90"
            style={{ background: '#E8634A' }}>
            Přidat
          </button>
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#8B6550' }}>
          Tip: psaním se zobrazují návrhy · více míst odděluj čárkami · lze přidat i celý <strong>okres</strong> nebo <strong>kraj</strong>
        </p>
      </div>

      {/* Aktuální list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-[#1A0F0A]">
            Aktuální dosah ({cities.length} {cities.length === 1 ? 'záznam' : cities.length < 5 ? 'záznamy' : 'záznamů'})
          </label>
          {cities.length > 0 && (
            <button onClick={() => { setCities([]); setSaved(false) }}
              className="text-xs border-none bg-transparent cursor-pointer hover:opacity-70"
              style={{ color: '#8B6550' }}>
              Smazat vše
            </button>
          )}
        </div>

        {cities.length === 0 ? (
          <div className="py-8 rounded-lg border border-dashed border-[#E0DDD8] text-center text-sm"
            style={{ color: '#8B6550' }}>
            Zatím není přidáno žádné místo.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-4 rounded-lg border border-[#F0EDE8] bg-[#FAFAF8]">
            {cities.sort().map(city => {
              const style = getCityStyle(city)
              const label = getCityLabel(city)
              return (
                <span key={city}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: style.bg, color: style.color }}>
                  {label && (
                    <span className="text-[10px] opacity-70 font-bold">{label}</span>
                  )}
                  {city}
                  <button onClick={() => removeCity(city)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-xs border-none cursor-pointer hover:opacity-70 bg-transparent"
                    style={{ color: style.color }}>
                    ✕
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Uložit */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
          style={{ background: '#E8634A' }}>
          {saving ? 'Ukládám...' : 'Uložit dosah'}
        </button>
        {saved && (
          <span className="text-sm font-semibold" style={{ color: '#3B6D11' }}>✓ Uloženo</span>
        )}
        {error && (
          <span className="text-sm" style={{ color: '#993C1D' }}>{error}</span>
        )}
      </div>
    </div>
  )
}
