'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useRef, useEffect } from 'react'

interface Species { id: string; name_cs: string; icon: string | null }
interface Suggestion { id: string; label: string; sub: string }

interface Props {
  currentQ:        string
  currentStatus:   string
  isShelter:       boolean
  institutionName: string
}

const SHELTER_STATUSES = [
  { value: 'available',      label: 'K adopci' },
  { value: 'reserved',       label: 'Rezervováno' },
  { value: 'adopted',        label: 'Adoptováno' },
  { value: 'foster',         label: 'Pěstounská péče' },
  { value: 'intake',         label: 'V příjmu' },
  { value: 'treatment',      label: 'Léčba' },
  { value: 'rehabilitation', label: 'Rehabilitace' },
  { value: 'deceased',       label: 'Uhynulo' },
]

const RESCUE_STATUSES = [
  { value: 'intake',         label: 'V příjmu' },
  { value: 'treatment',      label: 'Léčba' },
  { value: 'rehabilitation', label: 'Rehabilitace' },
  { value: 'released',       label: 'Propuštěno' },
  { value: 'deceased',       label: 'Uhynulo' },
]

const MONTHS = [
  'Leden','Únor','Březen','Duben','Květen','Červen',
  'Červenec','Srpen','Září','Říjen','Listopad','Prosinec',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i)

export function AdminAnimalSearch({
  currentQ, currentStatus, isShelter, institutionName,
}: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const accentColor  = isShelter ? '#E8634A' : '#2E9E8F'

  const [q, setQ]                     = useState(currentQ)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSug, setShowSug]         = useState(false)
  const [showExport, setShowExport]   = useState(false)

  // Export filters
  const [expStatus, setExpStatus]   = useState('')
  const [expYear, setExpYear]       = useState('')
  const [expMonth, setExpMonth]     = useState('')
  const [downloading, setDownloading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── URL builder ──────────────────────────────────────────────────────────
  const pushUrl = useCallback((overrides: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString())
    current.delete('page')
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) current.set(k, v)
      else current.delete(k)
    })
    router.push(`/admin/animals?${current.toString()}`)
  }, [router, searchParams])

  // ── Autocomplete ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setSuggestions([]); setShowSug(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/animals/suggest?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
          setShowSug(data.length > 0)
        }
      } catch { /* ignore */ }
    }, 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSug(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSug(false)
    pushUrl({ q: q.trim() })
  }

  const handleSuggestionClick = (s: Suggestion) => {
    setShowSug(false)
    router.push(`/admin/animals/${s.id}`)
  }

  // ── Export helpers ────────────────────────────────────────────────────────
  const buildExportParams = () => {
    const p = new URLSearchParams()
    if (expStatus) p.set('status', expStatus)
    if (expYear)   p.set('year',   expYear)
    if (expMonth)  p.set('month',  expMonth)
    return p.toString()
  }

  const downloadCsv = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/animals/export?${buildExportParams()}`)
      if (!res.ok) throw new Error('Chyba při exportu')
      const blob = await res.blob()
      const url  = URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8' }))
      const a    = document.createElement('a')
      const safe = institutionName.replace(/[^a-zA-Z0-9]/g, '-')
      const date = new Date().toISOString().slice(0, 10)
      a.href     = url
      a.download = `export-${safe}-${date}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setTimeout(() => setShowExport(false), 200)
    } catch {
      alert('Export se nezdařil. Zkuste to znovu.')
    } finally {
      setDownloading(false)
    }
  }

  const openPdf = () => {
    window.open(`/api/animals/export/pdf?${buildExportParams()}`, '_blank')
    setTimeout(() => setShowExport(false), 200)
  }

  const statuses = isShelter ? SHELTER_STATUSES : RESCUE_STATUSES

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mb-5">

        {/* ── Vyhledávání s našeptávačem ── */}
        <div ref={containerRef} className="relative flex flex-1 min-w-0">
          <form onSubmit={handleSearch} className="flex flex-1">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: '#8B6550' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={q}
                onChange={e => { setQ(e.target.value); if (e.target.value.length >= 2) setShowSug(true) }}
                onFocus={() => { if (suggestions.length > 0) setShowSug(true) }}
                onKeyDown={e => e.key === 'Escape' && setShowSug(false)}
                placeholder={isShelter
                  ? 'Hledat podle jména, rasy nebo čísla čipu...'
                  : 'Hledat podle jména nebo čísla případu...'}
                className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-l-lg font-body text-sm text-[#2C1810] placeholder:text-[#A09890] outline-none focus:border-[#E8634A]/50 transition-colors"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 px-4 py-2.5 rounded-r-lg font-bold text-sm text-white transition-colors cursor-pointer border-none"
              style={{ backgroundColor: accentColor }}
            >
              Hledat
            </button>
          </form>

          {/* Dropdown s výsledky */}
          {showSug && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-[72px] mt-1 bg-white border border-[#F0EDE8] rounded-lg shadow-lg z-50 overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#FFFCF8] transition-colors border-b border-[#F0EDE8] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#2C1810] truncate">{s.label}</div>
                    {s.sub && <div className="text-xs text-[#8B6550] truncate">{s.sub}</div>}
                  </div>
                  <span className="text-[11px] text-[#A09890] shrink-0">přejít →</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Export tlačítko ── */}
        <button
          type="button"
          onClick={() => setShowExport(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-lg font-bold text-sm text-[#8B6550] hover:bg-[#F5E6D3] hover:border-[#EDD8C0] transition-colors cursor-pointer whitespace-nowrap"
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Export modal ── */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowExport(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">

            {/* Hlavička modálu */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EDE8]">
              <div>
                <h2 className="font-display font-extrabold text-base text-[#2C1810]">Export zvířat</h2>
                <p className="text-xs text-[#8B6550] mt-0.5">{institutionName}</p>
              </div>
              <button
                onClick={() => setShowExport(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8B6550] hover:bg-[#F0EDE8] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Filtr stavu */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8B6550] mb-1.5">
                  Status
                </label>
                <select
                  value={expStatus}
                  onChange={e => setExpStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-lg text-sm text-[#2C1810] outline-none focus:border-[#E8634A]/40 transition-colors appearance-none"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B6550' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    paddingRight: '2.5rem',
                  }}
                >
                  <option value="">Všechny stavy</option>
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Rok + měsíc */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8B6550] mb-1.5">
                    Rok příjmu
                  </label>
                  <select
                    value={expYear}
                    onChange={e => { setExpYear(e.target.value); if (!e.target.value) setExpMonth('') }}
                    className="w-full px-3 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-lg text-sm text-[#2C1810] outline-none focus:border-[#E8634A]/40 transition-colors appearance-none"
                    style={{
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B6550' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      paddingRight: '2.5rem',
                    }}
                  >
                    <option value="">Všechny roky</option>
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8B6550] mb-1.5">
                    Měsíc (volitelný)
                  </label>
                  <select
                    value={expMonth}
                    onChange={e => setExpMonth(e.target.value)}
                    disabled={!expYear}
                    className="w-full px-3 py-2.5 bg-white border-2 border-[#F0EDE8] rounded-lg text-sm text-[#2C1810] outline-none focus:border-[#E8634A]/40 transition-colors appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B6550' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      paddingRight: '2.5rem',
                    }}
                  >
                    <option value="">Celý rok</option>
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info */}
              <div className="bg-[#F5F0EC] rounded-lg px-4 py-3 text-xs text-[#8B6550]">
                Export obsahuje seznam zvířat ve formátu CSV (kompatibilní s Excelem) včetně celkových počtů a údajů o instituci — vhodné pro výpisy pro úřady.
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={downloadCsv}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#E8634A] text-white font-bold text-sm hover:bg-[#d4553e] disabled:opacity-50 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {downloading ? 'Stahuji...' : 'CSV (Excel)'}
              </button>
              <button
                type="button"
                onClick={openPdf}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#2C1810] text-white font-bold text-sm hover:bg-[#3d2518] transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF / Tisk
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
