'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// ── Konfigurace aktivit ────────────────────────────────────────────────────
const ACTIVITIES = [
  { id: 'walking',    icon: '🦮', label: 'Venčení psů',      desc: 'Pravidelné procházky s psy z útulku' },
  { id: 'socializing',icon: '🐱', label: 'Socializace koček', desc: 'Mazlení a přivykání na lidský kontakt' },
  { id: 'events',     icon: '🎪', label: 'Pomoc na akcích',   desc: 'Adopční dny, charitativní akce' },
  { id: 'transport',  icon: '🚗', label: 'Přeprava zvířat',   desc: 'Odvoz k veterináři, převozy mezi stanicemi' },
  { id: 'care',       icon: '🤝', label: 'Péče o zvířata',    desc: 'Krmení, čištění, základní každodenní péče' },
  { id: 'fostering',  icon: '🏡', label: 'Dočasná péče', desc: 'Dočasná péče o zvíře ve vlastní domácnosti' },
  { id: 'admin',      icon: '📷', label: 'Foto & sociální sítě', desc: 'Focení zvířat, správa profilů na sítích' },
  { id: 'other',      icon: '✏️', label: 'Jiné',              desc: 'Cokoliv dalšího, co byste rádi nabídli' },
]

const DAYS = [
  { id: 'weekdays', label: 'Po–Pá' },
  { id: 'weekend',  label: 'So–Ne' },
]

const FREQUENCY = [
  { id: 'occasional', label: 'Příležitostně' },
  { id: 'regular',    label: 'Pravidelně (1–2× týdně)' },
  { id: 'flexible',   label: 'Flexibilně' },
]

interface Institution {
  id: string
  name: string
  slug: string
  type: 'shelter'
  city: string
  logo_url: string | null
}

interface Props {
  onClose: () => void
  userEmail: string
  userName: string
  /** Pokud chceme přeskočit krok 1 (přihlašování z profilu instituce) */
  preselectedInstitution?: Institution
  /** Zavolá se po úspěšném odeslání (před zavřením) */
  onSuccess?: () => void
}

export function VolunteerRegisterModal({ onClose, userEmail, userName, preselectedInstitution, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(preselectedInstitution ? 2 : 1)
  const [institution, setInstitution] = useState<Institution | null>(preselectedInstitution ?? null)

  // Krok 1 — vyhledávání
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'shelter'>('all')
  const [searchResults, setSearchResults] = useState<Institution[]>([])
  const [searching, setSearching] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Krok 2 — aktivity + dostupnost
  const [activities, setActivities] = useState<string[]>([])
  const [days, setDays] = useState<string[]>([])
  const [frequency, setFrequency] = useState('')

  // Krok 3 — kontakt
  const [name, setName] = useState(userName)
  const [email, setEmail] = useState(userEmail)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Vyhledávání institucí
  useEffect(() => {
    if (step !== 1) return
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    setHighlightIndex(-1)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams({ q: search })
        if (typeFilter !== 'all') params.set('type', typeFilter)
        const res = await fetch(`/api/institutions/search?${params}`)
        const json = await res.json()
        setSearchResults(json.institutions ?? [])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search, typeFilter, step])

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!searchResults.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(i => Math.min(i + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      setInstitution(searchResults[highlightIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Scroll aktivního prvku do view
  useEffect(() => {
    if (highlightIndex < 0 || !resultsRef.current) return
    const el = resultsRef.current.children[highlightIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  function highlightMatch(text: string, query: string) {
    if (!query.trim()) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx < 0) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#FAEEDA] text-[#854F0B] rounded px-0.5 not-italic font-bold">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    )
  }

  function toggleActivity(id: string) {
    setActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  function toggleDay(id: string) {
    setDays(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!institution) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution_id: institution.id,
          name,
          email,
          phone:             phone || null,
          activities,
          availability_data: { days, frequency },
          message:           message || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Chyba')
      onSuccess?.()
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Backdrop + scrolllock ──────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const canStep2 = !!institution
  const canStep3 = activities.length > 0
  const canSubmit = name.trim() && email.trim()

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(44,24,16,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full sm:max-w-[560px] sm:rounded-[24px] rounded-t-[24px] flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#F0EDE8] flex-shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: '#FAECE7' }}>
            🙋
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-extrabold text-[#1A0F0A] text-base leading-tight">
              {done ? 'Přihláška odeslána!' : 'Stát se dobrovolníkem'}
            </h2>
            {!done && (
              <p className="text-[11px] mt-0.5" style={{ color: '#8B6550' }}>
                Krok {step} ze 3
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#8B6550] hover:bg-[#F5E6D3] transition-colors flex-shrink-0 text-lg leading-none"
            aria-label="Zavřít"
          >
            ×
          </button>
        </div>

        {/* Stepper */}
        {!done && (
          <div className="flex gap-1.5 px-5 pt-4 flex-shrink-0">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: s <= step ? '#E8634A' : '#F0EDE8' }}
              />
            ))}
          </div>
        )}

        {/* Obsah */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* ── Hotovo ── */}
          {done && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-display font-extrabold text-xl text-[#1A0F0A] mb-2">
                Přihláška odeslána!
              </h3>
              <p className="text-sm mb-1" style={{ color: '#8B6550' }}>
                Tvoje přihláška dobrovolníka do
              </p>
              <p className="font-bold text-[#1A0F0A] mb-4">{institution?.name}</p>
              <p className="text-sm" style={{ color: '#8B6550' }}>
                Organizace tě brzy kontaktuje na <strong>{email}</strong>.
                Stav přihlášky uvidíš v profilu.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 rounded-[100px] font-bold text-white text-sm"
                style={{ background: '#E8634A' }}
              >
                Zpět na profil
              </button>
            </div>
          )}

          {/* ── Krok 1 — Výběr organizace ── */}
          {!done && step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="font-bold text-[#1A0F0A] mb-1">Vybrat organizaci</p>
                <p className="text-sm" style={{ color: '#8B6550' }}>
                  Pro kterou organizaci se chceš přihlásit jako dobrovolník?
                </p>
              </div>

              {/* Filtr type */}
              <div className="flex gap-2">
                {([['all', 'Vše'], ['shelter', '🏠 Útulky']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setTypeFilter(val)}
                    className="px-3 py-1.5 rounded-[100px] text-xs font-bold transition-all border"
                    style={typeFilter === val
                      ? { background: '#E8634A', color: 'white', borderColor: '#E8634A' }
                      : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A0968C' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Hledat podle názvu nebo města..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: search ? '#E8634A' : '#E0DDD8', background: '#FFFCF8' }}
                  autoFocus
                  autoComplete="off"
                  aria-label="Vyhledat organizaci"
                  aria-autocomplete="list"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); inputRef.current?.focus() }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-xs"
                    style={{ background: '#E0DDD8', color: '#6B4030' }}
                    tabIndex={-1}
                    aria-label="Vymazat hledání"
                  >×</button>
                )}
                {searching && !search && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#8B6550' }}>⏳</div>
                )}
              </div>

              {/* Nápověda klávesnice */}
              {searchResults.length > 0 && (
                <p className="text-[11px] px-1" style={{ color: '#A0968C' }}>
                  ↑↓ navigace · Enter pro výběr · Esc zavřít
                </p>
              )}

              {/* Výsledky */}
              <div ref={resultsRef} className="space-y-1.5 max-h-[280px] overflow-y-auto pr-0.5">
                {searchResults.length === 0 && !searching && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">{search ? '🔍' : '🏠'}</div>
                    <p className="text-sm" style={{ color: '#8B6550' }}>
                      {search ? `Nenalezena žádná organizace pro "${search}"` : 'Začni psát název nebo město…'}
                    </p>
                  </div>
                )}
                {searching && (
                  <div className="text-center py-6 text-sm" style={{ color: '#8B6550' }}>Hledám…</div>
                )}
                {!searching && searchResults.map((inst, idx) => {
                  const isSelected  = institution?.id === inst.id
                  const isHighlight = idx === highlightIndex
                  return (
                    <button
                      key={inst.id}
                      onClick={() => { setInstitution(inst); setHighlightIndex(idx) }}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={isSelected
                        ? { borderColor: '#E8634A', background: '#FDEAE6', boxShadow: '0 0 0 2px #E8634A33' }
                        : isHighlight
                        ? { borderColor: '#E8634A', background: '#FFF4F1' }
                        : { borderColor: '#F0EDE8', background: 'white' }
                      }
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg overflow-hidden relative"
                        style={{ background: inst.type === 'shelter' ? '#FAECE7' : '#E1F5EE' }}
                      >
                        {inst.logo_url
                          ? <Image src={inst.logo_url} alt={inst.name} fill className="object-cover" />
                          : <span>{inst.type === 'shelter' ? '🏠' : '🚑'}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#1A0F0A] truncate">
                          {highlightMatch(inst.name, search)}
                        </div>
                        <div className="text-xs" style={{ color: '#8B6550' }}>
                          📍 {highlightMatch(inst.city, search)} · {inst.type === 'shelter' ? 'Útulek' : 'Záchranná stanice'}
                        </div>
                      </div>
                      {isSelected
                        ? <span className="text-base flex-shrink-0" style={{ color: '#E8634A' }}>✓</span>
                        : isHighlight
                        ? <span className="text-base flex-shrink-0" style={{ color: '#C85A35' }}>→</span>
                        : null
                      }
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Krok 2 — Aktivity + dostupnost ── */}
          {!done && step === 2 && (
            <div className="space-y-5">
              {institution && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: '#F5E6D3' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 overflow-hidden relative"
                    style={{ background: institution.type === 'shelter' ? '#FAECE7' : '#E1F5EE' }}>
                    {institution.logo_url
                      ? <Image src={institution.logo_url} alt={institution.name} fill className="object-cover" />
                      : <span>{institution.type === 'shelter' ? '🏠' : '🚑'}</span>
                    }
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1A0F0A]">{institution.name}</div>
                    <div className="text-xs" style={{ color: '#8B6550' }}>📍 {institution.city}</div>
                  </div>
                </div>
              )}

              <div>
                <p className="font-bold text-[#1A0F0A] mb-1">Co jsi ochoten/ochotna dělat?</p>
                <p className="text-xs mb-3" style={{ color: '#8B6550' }}>Vyber alespoň jednu aktivitu</p>
                <div className="grid grid-cols-1 gap-2">
                  {ACTIVITIES.map(a => (
                    <button
                      key={a.id}
                      onClick={() => toggleActivity(a.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={activities.includes(a.id)
                        ? { borderColor: '#E8634A', background: '#FDEAE6' }
                        : { borderColor: '#F0EDE8', background: 'white' }
                      }
                    >
                      <span className="text-xl flex-shrink-0">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#1A0F0A]">{a.label}</div>
                        <div className="text-xs" style={{ color: '#8B6550' }}>{a.desc}</div>
                      </div>
                      <div
                        className="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all"
                        style={activities.includes(a.id)
                          ? { borderColor: '#E8634A', background: '#E8634A' }
                          : { borderColor: '#D0C8C0' }
                        }
                      >
                        {activities.includes(a.id) && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-[#1A0F0A] mb-2">Kdy jsi k dispozici?</p>
                <div className="flex gap-2 mb-3">
                  {DAYS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => toggleDay(d.id)}
                      className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all"
                      style={days.includes(d.id)
                        ? { borderColor: '#E8634A', background: '#FDEAE6', color: '#993C1D' }
                        : { borderColor: '#F0EDE8', background: 'white', color: '#6B4030' }
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <p className="font-bold text-[#1A0F0A] mb-2 text-sm">Jak často?</p>
                <div className="space-y-2">
                  {FREQUENCY.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFrequency(f.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all"
                      style={frequency === f.id
                        ? { borderColor: '#E8634A', background: '#FDEAE6', color: '#993C1D' }
                        : { borderColor: '#F0EDE8', background: 'white', color: '#6B4030' }
                      }
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
                        style={frequency === f.id
                          ? { borderColor: '#E8634A', background: '#E8634A' }
                          : { borderColor: '#D0C8C0' }
                        }
                      />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Krok 3 — Kontakt + zpráva ── */}
          {!done && step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="font-bold text-[#1A0F0A] mb-1">Tvoje kontaktní údaje</p>
                <p className="text-sm" style={{ color: '#8B6550' }}>
                  Organizace tě na těchto kontaktech osloví.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#6B4030] block mb-1">Jméno a příjmení *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E0DDD8', background: '#FFFCF8' }}
                    placeholder="Jana Novák"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6B4030] block mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E0DDD8', background: '#FFFCF8' }}
                    placeholder="jana@email.cz"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6B4030] block mb-1">Telefon (volitelné)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E0DDD8', background: '#FFFCF8' }}
                    placeholder="+420 777 123 456"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6B4030] block mb-1">Zpráva pro organizaci (volitelné)</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: '#E0DDD8', background: '#FFFCF8' }}
                    placeholder="Přidej cokoliv, co by organizace měla vědět — zkušenosti se zvířaty, vlastní zvířata doma, omezení apod."
                  />
                </div>
              </div>

              {/* Souhrn aktivit */}
              {activities.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: '#F5E6D3' }}>
                  <p className="text-xs font-bold text-[#6B4030] mb-2">Vybrané aktivity</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activities.map(id => {
                      const a = ACTIVITIES.find(x => x.id === id)
                      return a ? (
                        <span key={id} className="px-2.5 py-1 rounded-[100px] text-xs font-bold"
                          style={{ background: '#FAECE7', color: '#993C1D' }}>
                          {a.icon} {a.label}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl text-sm font-semibold" style={{ background: '#FAECE7', color: '#993C1D' }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — navigační tlačítka */}
        {!done && (
          <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F0EDE8] flex-shrink-0">
            {step > 1 && (
              <button
                onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="px-5 py-3 rounded-[100px] text-sm font-bold border transition-all"
                style={{ borderColor: '#E0DDD8', color: '#6B4030' }}
              >
                ← Zpět
              </button>
            )}
            <div className="flex-1" />
            {step < 3 && (
              <button
                onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                disabled={step === 1 ? !canStep2 : !canStep3}
                className="px-6 py-3 rounded-[100px] text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: '#E8634A' }}
              >
                Pokračovat →
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="px-6 py-3 rounded-[100px] text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: '#E8634A' }}
              >
                {submitting ? 'Odesílám…' : 'Odeslat přihlášku'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
