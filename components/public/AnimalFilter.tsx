'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

interface FilterProps {
  species: { id: string; name_cs: string; icon: string | null }[]
  cities: string[]
  params: { species?: string; city?: string; size?: string; urgent?: string }
}

export function AnimalFilter({ species, cities, params }: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const updateFilter = useCallback((key: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString())
    if (value) current.set(key, value)
    else current.delete(key)
    current.delete('page')
    router.push(`/adopt?${current.toString()}`)
  }, [router, searchParams])

  const clearAll = () => router.push('/adopt')
  const hasFilters = params.species || params.city || params.size || params.urgent

  const selectCls = 'px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-coral transition-colors cursor-pointer w-full'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-pale p-4 mb-6">

      {/* Mobile — toggle button */}
      <div className="flex items-center justify-between md:hidden mb-2">
        <span className="font-display font-bold text-sm text-espresso">
          Filtry {hasFilters && <span className="text-coral">({[params.species, params.city, params.size, params.urgent].filter(Boolean).length})</span>}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-bold text-coral cursor-pointer bg-transparent border-none"
        >
          {open ? 'Zavřít ▲' : 'Zobrazit ▼'}
        </button>
      </div>

      {/* Filters — always visible on md+, toggle on mobile */}
      <div className={`${open ? 'block' : 'hidden'} md:block`}>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[150px]">
            <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">Druh</label>
            <select value={params.species ?? ''} onChange={e => updateFilter('species', e.target.value)} className={selectCls}>
              <option value="">Všechna zvířata</option>
              {species.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name_cs}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[150px]">
            <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">Město</label>
            <select value={params.city ?? ''} onChange={e => updateFilter('city', e.target.value)} className={selectCls}>
              <option value="">Celá ČR a SR</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[130px]">
            <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">Velikost</label>
            <select value={params.size ?? ''} onChange={e => updateFilter('size', e.target.value)} className={selectCls}>
              <option value="">Jakákoliv</option>
              <option value="small">Malý</option>
              <option value="medium">Střední</option>
              <option value="large">Velký</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">Urgentní</label>
            <button
              onClick={() => updateFilter('urgent', params.urgent === 'true' ? '' : 'true')}
              className={`px-4 py-2.5 rounded-sm font-body text-sm font-bold border-2 transition-all cursor-pointer
                ${params.urgent === 'true' ? 'bg-coral text-white border-coral' : 'bg-white text-gray border-gray-pale hover:border-coral'}`}
            >
              🆘 Urgentní adopce
            </button>
          </div>

          {hasFilters && (
            <button onClick={clearAll} className="text-sm font-bold text-gray hover:text-coral transition-colors cursor-pointer bg-transparent border-none self-end pb-2.5">
              ✕ Zrušit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
