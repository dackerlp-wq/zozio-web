'use client'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SearchInputProps {
  initialValue?: string
}

export function SearchInput({ initialValue = '' }: SearchInputProps) {
  const router          = useRouter()
  const [q, setQ]       = useState(initialValue)
  const [, startTransition] = useTransition()
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (value: string) => {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        if (value.trim().length >= 2) {
          router.push(`/search?q=${encodeURIComponent(value.trim())}`)
        } else if (value.trim().length === 0) {
          router.push('/search')
        }
      })
    }, 350)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

  const clear = () => {
    setQ('')
    router.push('/search')
  }

  return (
    <form onSubmit={handleSubmit} className="relative" role="search">
      <label htmlFor="main-search" className="sr-only">Hledat na Zozio</label>
      <div className="flex items-center gap-0 rounded-2xl overflow-hidden border-2 transition-all"
        style={{ borderColor: q ? '#E8634A' : '#E0DDD8', background: 'white' }}>

        {/* Lupa */}
        <div aria-hidden="true" className="pl-5 pr-3 flex-shrink-0" style={{ color: q ? '#E8634A' : '#C8C5BF' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 15l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Input */}
        <input
          id="main-search"
          type="search"
          value={q}
          onChange={e => handleChange(e.target.value)}
          placeholder="Hledej zvíře, útulek, město, druh..."
          className="flex-1 py-4 text-base outline-none bg-transparent"
          style={{ color: '#1A0F0A', minWidth: 0 }}
        />

        {/* Clear */}
        {q && (
          <button type="button" onClick={clear} aria-label="Vymazat hledání"
            className="px-3 cursor-pointer bg-transparent border-none flex-shrink-0"
            style={{ color: '#8B6550' }}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Search button */}
        <button type="submit"
          className="px-6 py-4 font-bold text-sm text-white cursor-pointer border-none flex-shrink-0"
          style={{ background: '#E8634A' }}>
          Hledat
        </button>
      </div>

      {/* Tip */}
      {q.length === 1 && (
        <p className="text-xs mt-2" style={{ color: '#6B4030' }}>Zadej alespoň 2 znaky...</p>
      )}
    </form>
  )
}
