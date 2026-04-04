'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

interface Species {
  id: string
  name_cs: string
  icon: string | null
}

interface AdminAnimalSearchProps {
  currentQ:       string
  currentStatus:  string
  currentSpecies: string
  speciesList:    Species[]
  isShelter:      boolean
}

export function AdminAnimalSearch({
  currentQ,
  currentStatus,
  currentSpecies,
  speciesList,
  isShelter,
}: AdminAnimalSearchProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ]    = useState(currentQ)

  const pushUrl = useCallback((overrides: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString())
    current.delete('page')
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) current.set(k, v)
      else current.delete(k)
    })
    router.push(`/admin/animals?${current.toString()}`)
  }, [router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    pushUrl({ q: q.trim() })
  }

  const handleSpecies = (e: React.ChangeEvent<HTMLSelectElement>) => {
    pushUrl({ species: e.target.value })
  }

  const accentColor = isShelter ? '#E8634A' : '#2E9E8F'

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-5">
      {/* Search input */}
      <form onSubmit={handleSearch} className="flex flex-1 min-w-0">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] select-none pointer-events-none">🔍</span>
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={isShelter ? 'Hledat jméno, druh, číslo...' : 'Hledat jméno, číslo případu...'}
            className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-xl font-body text-sm text-espresso placeholder:text-[#8B6550] outline-none focus:border-[#E8634A]/40 transition-colors"
            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
          />
        </div>
        <button
          type="submit"
          className="shrink-0 ml-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors cursor-pointer border-none"
          style={{ backgroundColor: accentColor }}
        >
          Hledat
        </button>
      </form>

      {/* Species filter */}
      <select
        value={currentSpecies}
        onChange={handleSpecies}
        className="px-3 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-xl font-body text-sm text-espresso outline-none focus:border-[#E8634A]/40 transition-colors cursor-pointer appearance-none pr-8 min-w-[140px]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B6550' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
      >
        <option value="">Všechny druhy</option>
        {speciesList.map(s => (
          <option key={s.id} value={s.id}>
            {s.icon ? `${s.icon} ` : ''}{s.name_cs}
          </option>
        ))}
      </select>

      {/* Export button */}
      <button
        type="button"
        className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-xl font-bold text-sm text-[#8B6550] hover:bg-[#F5E6D3] hover:border-[#EDD8C0] transition-colors cursor-pointer"
        title="Exportovat"
      >
        <span>⬇</span>
        <span className="hidden sm:inline">Export</span>
      </button>
    </div>
  )
}
