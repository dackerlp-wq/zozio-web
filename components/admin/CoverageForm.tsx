'use client'
import { useState } from 'react'

interface CoverageFormProps {
  institutionName: string
  initialCities:   string[]
}

export function CoverageForm({ institutionName, initialCities }: CoverageFormProps) {
  const [cities,  setCities]  = useState<string[]>(initialCities)
  const [input,   setInput]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const addCity = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    // Přidej všechna hesla oddělená čárkou nebo středníkem
    const newCities = trimmed
      .split(/[,;]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0 && !cities.includes(c))
    if (!newCities.length) { setInput(''); return }
    setCities(prev => [...prev, ...newCities])
    setInput('')
    setSaved(false)
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

  return (
    <div className="max-w-2xl">
      <p className="text-sm mb-6" style={{ color: '#6B4030' }}>
        Zadej města a obce, odkud přijímáš zvířata do <strong>{institutionName}</strong>.
        Tato informace se zobrazí na mapě a pomůže lidem rychle najít správnou instituci.
      </p>

      {/* Přidat město */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-[#1A0F0A] mb-2">Přidat město / obec</label>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCity() } }}
            placeholder="Praha, Kladno, Beroun... (odděluj čárkami)"
            className="flex-1 px-3 py-2.5 rounded-lg border border-[#E0DDD8] text-sm focus:outline-none focus:border-[#E8634A]"
          />
          <button
            onClick={addCity}
            className="px-4 py-2.5 rounded-lg font-bold text-sm text-white border-none cursor-pointer hover:opacity-90"
            style={{ background: '#E8634A' }}>
            Přidat
          </button>
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#8B6550' }}>
          Tip: Více měst najednou — odděluj čárkami (Praha, Kladno, Mělník)
        </p>
      </div>

      {/* Aktuální list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-[#1A0F0A]">
            Aktuální dosah ({cities.length} {cities.length === 1 ? 'město' : cities.length < 5 ? 'města' : 'měst'})
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
            Zatím není přidáno žádné město.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-4 rounded-lg border border-[#F0EDE8] bg-[#FAFAF8]">
            {cities.sort().map(city => (
              <span key={city}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-semibold"
                style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                {city}
                <button onClick={() => removeCity(city)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs border-none cursor-pointer hover:opacity-70 bg-transparent"
                  style={{ color: '#3B6D11' }}>
                  ✕
                </button>
              </span>
            ))}
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
