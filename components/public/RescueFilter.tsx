'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

interface RescueFilterProps {
  species: { id: string; name_cs: string; icon: string | null }[]
  cities: string[]
  params: { species?: string; status?: string; city?: string }
}

export function RescueFilter({ species, cities, params }: RescueFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const updateFilter = useCallback((key: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString())
    if (value) current.set(key, value)
    else current.delete(key)
    router.push(`/rescue?${current.toString()}`)
  }, [router, searchParams])

  const clearAll = () => router.push('/rescue')
  const hasFilters = params.species || params.status || params.city
  const selectCls = 'px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso bg-white outline-none focus:border-rescue transition-colors cursor-pointer w-full'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-pale p-4 mb-6">
      <div className="flex items-center justify-between md:hidden mb-2">
        <span className="font-display font-bold text-sm text-espresso">
          Filtry {hasFilters && <span className="text-rescue">({[params.species, params.status, params.city].filter(Boolean).length})</span>}
        </span>
        <button onClick={() => setOpen(!open)} className="text-xs font-bold text-rescue cursor-pointer bg-transparent border-none">
          {open ? 'Zavřít ▲' : 'Zobrazit ▼'}
        </button>
      </div>

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
            <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">Stav léčby</label>
            <select value={params.status ?? ''} onChange={e => updateFilter('status', e.target.value)} className={selectCls}>
              <option value="">Všechny stavy</option>
              <option value="intake">🚑 Příjem</option>
              <option value="treatment">🩺 Léčba</option>
              <option value="rehabilitation">💪 Rehabilitace</option>
              <option value="released">✓ Propuštěn</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[150px]">
            <label className="font-body text-xs font-bold text-brown uppercase tracking-wider">Záchranná stanice</label>
            <select value={params.city ?? ''} onChange={e => updateFilter('city', e.target.value)} className={selectCls}>
              <option value="">Celá ČR a SR</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button onClick={clearAll} className="text-sm font-bold text-gray hover:text-rescue transition-colors cursor-pointer bg-transparent border-none self-end pb-2.5">
              ✕ Zrušit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
