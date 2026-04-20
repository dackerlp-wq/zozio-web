'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface BreedSearchItem {
  name: string
  slug: string
  speciesIcon: string
  speciesName: string
  count: number
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function BreedSearch({ breeds }: { breeds: BreedSearchItem[] }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const router = useRouter()

  const results = q.trim().length < 1 ? [] : breeds.filter(b =>
    norm(b.name).includes(norm(q.trim()))
  ).slice(0, 8)

  useEffect(() => {
    setCursor(-1)
  }, [q])

  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const el = listRef.current.children[cursor] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [cursor])

  function select(breed: BreedSearchItem) {
    router.push(`/katalog/${breed.slug}`)
    setQ('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (cursor >= 0) select(results[cursor]) }
    else if (e.key === 'Escape') { setOpen(false); setQ(''); inputRef.current?.blur() }
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: '#A08070' }}>
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          placeholder="Hledat plemeno..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors focus:outline-none"
          style={{
            background: 'white',
            borderColor: open && q ? '#E8634A' : '#F0EDE8',
            color: '#1A0F0A',
          }}
        />
        {q && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setQ(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold transition-colors"
            style={{ color: '#A08070' }}>
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border border-[#F0EDE8] bg-white shadow-lg overflow-hidden z-50"
          style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {results.map((b, i) => (
            <li key={b.slug}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); select(b) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  background: i === cursor ? '#FBF0EC' : 'white',
                  color: '#1A0F0A',
                }}>
                <span className="text-lg flex-shrink-0">{b.speciesIcon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block truncate"
                    style={{ color: i === cursor ? '#E8634A' : '#1A0F0A' }}>
                    {highlight(b.name, q)}
                  </span>
                  <span className="text-xs" style={{ color: '#A08070' }}>{b.speciesName}</span>
                </div>
                {b.count > 0 && (
                  <span className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#FBF0EC', color: '#E8634A' }}>
                    {b.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && q.trim().length >= 1 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border border-[#F0EDE8] bg-white shadow-lg px-4 py-3 text-sm z-50"
          style={{ color: '#A08070' }}>
          Žádné plemeno nenalezeno pro „{q}"
        </div>
      )}
    </div>
  )
}

function highlight(text: string, query: string): React.ReactNode {
  const idx = norm(text).indexOf(norm(query))
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="font-extrabold bg-transparent" style={{ color: '#E8634A' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
