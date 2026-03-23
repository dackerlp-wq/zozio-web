'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface RescueFilterProps {
  species: { id: string; name_cs: string; icon: string | null }[]
  cities: string[]
  params: {
    species?: string
    status?: string
    city?: string
  }
}

export function RescueFilter({ species, cities, params }: RescueFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString())
    if (value) current.set(key, value)
    else current.delete(key)
    router.push(`/rescue?${current.toString()}`)
  }, [router, searchParams])

  const clearAll = () => router.push('/rescue')
  const hasFilters = params.species || params.status || params.city

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-pale p-5 mb-8">
      <div className="flex flex-wrap gap-4 items-end">

        {/* Druh */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">
            Druh zvířete
          </label>
          <select
            value={params.species ?? ''}
            onChange={e => updateFilter('species', e.target.value)}
            className="px-3.5 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-rescue transition-colors cursor-pointer"
          >
            <option value="">Všechna zvířata</option>
            {species.map(s => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name_cs}
              </option>
            ))}
          </select>
        </div>

        {/* Stav léčby */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">
            Stav léčby
          </label>
          <select
            value={params.status ?? ''}
            onChange={e => updateFilter('status', e.target.value)}
            className="px-3.5 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-rescue transition-colors cursor-pointer"
          >
            <option value="">Všechny stavy</option>
            <option value="intake">🚑 Příjem</option>
            <option value="treatment">🩺 Léčba</option>
            <option value="rehabilitation">💪 Rehabilitace</option>
            <option value="released">✓ Propuštěn do přírody</option>
          </select>
        </div>

        {/* Město */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">
            Záchranná stanice
          </label>
          <select
            value={params.city ?? ''}
            onChange={e => updateFilter('city', e.target.value)}
            className="px-3.5 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-rescue transition-colors cursor-pointer"
          >
            <option value="">Celá ČR a SR</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-4 py-2.5 font-body text-sm font-bold text-gray hover:text-rescue transition-colors cursor-pointer self-end"
          >
            ✕ Zrušit filtry
          </button>
        )}
      </div>
    </div>
  )
}
