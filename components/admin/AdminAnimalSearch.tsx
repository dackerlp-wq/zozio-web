'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

interface AdminAnimalSearchProps {
  statuses:      { value: string; label: string }[]
  currentStatus: string
  currentQ:      string
}

export function AdminAnimalSearch({ statuses, currentStatus, currentQ }: AdminAnimalSearchProps) {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ]   = useState(currentQ)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const current = new URLSearchParams(searchParams.toString())
    if (q.trim()) current.set('q', q.trim())
    else current.delete('q')
    router.push(`/admin/animals?${current.toString()}`)
  }

  const setStatus = useCallback((status: string) => {
    const current = new URLSearchParams(searchParams.toString())
    if (status) current.set('status', status)
    else current.delete('status')
    router.push(`/admin/animals?${current.toString()}`)
  }, [router, searchParams])

  return (
    <div className="bg-white rounded-lg border border-gray-pale shadow-sm p-4 mb-5 space-y-3">
      {/* Vyhledávání */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Hledat jméno, číslo případu..."
          className="flex-1 px-4 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors"
        />
        <button type="submit"
          className="px-4 py-2.5 bg-espresso text-white font-bold text-sm rounded-sm hover:bg-brown transition-colors cursor-pointer border-none">
          🔍
        </button>
      </form>

      {/* Filtry stavu */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(({ value, label }) => (
          <button key={value} onClick={() => setStatus(value)}
            className={`px-3 py-1.5 rounded-pill font-body text-xs font-bold transition-all cursor-pointer border-none
              ${currentStatus === value || (!currentStatus && !value)
                ? 'bg-espresso text-white'
                : 'bg-gray-pale text-gray hover:bg-gray-light'
              }`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
