'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface FilterProps {
  species: { id: string; name_cs: string; icon: string | null }[]
  cities: string[]
  params: {
    species?: string
    city?: string
    size?: string
    urgent?: string
  }
}

export function AnimalFilter({ species, cities, params }: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString())
    if (value) {
      current.set(key, value)
    } else {
      current.delete(key)
    }
    current.delete('page')
    router.push(`/adopt?${current.toString()}`)
  }, [router, searchParams])

  const clearAll = () => router.push('/adopt')

  const hasFilters = params.species || params.city || params.size || params.urgent

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
            className="px-3.5 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-coral transition-colors cursor-pointer"
          >
            <option value="">Všechna zvířata</option>
            {species.map(s => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name_cs}
              </option>
            ))}
          </select>
        </div>

        {/* Město */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">
            Město / kraj
          </label>
          <select
            value={params.city ?? ''}
            onChange={e => updateFilter('city', e.target.value)}
            className="px-3.5 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-coral transition-colors cursor-pointer"
          >
            <option value="">Celá ČR a SR</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Velikost */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">
            Velikost
          </label>
          <select
            value={params.size ?? ''}
            onChange={e => updateFilter('size', e.target.value)}
            className="px-3.5 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-coral transition-colors cursor-pointer"
          >
            <option value="">Jakákoliv</option>
            <option value="small">Malý</option>
            <option value="medium">Střední</option>
            <option value="large">Velký</option>
            <option value="xlarge">Extra velký</option>
          </select>
        </div>

        {/* Urgentní toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">
            Jen urgentní
          </label>
          <button
            onClick={() => updateFilter('urgent', params.urgent === 'true' ? '' : 'true')}
            className={`px-4 py-2.5 rounded-sm font-body text-sm font-bold border-2 transition-all cursor-pointer
              ${params.urgent === 'true'
                ? 'bg-coral text-white border-coral'
                : 'bg-white text-gray border-gray-pale hover:border-coral'
              }`}
          >
            🆘 Urgentní adopce
          </button>
        </div>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-4 py-2.5 font-body text-sm font-bold text-gray hover:text-coral transition-colors cursor-pointer self-end"
          >
            ✕ Zrušit filtry
          </button>
        )}
      </div>
    </div>
  )
}
