'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { NewsletterSubscribe } from './NewsletterSubscribe'
import { FavoriteButton } from './FavoriteButton'
import { AdSlot } from './AdSlot'
import { OpeningHoursDisplay } from './OpeningHoursDisplay'

interface Tab { id: string; label: string; count: number | null }

interface InstitutionTabsProps {
  tabs:         Tab[]
  activeTab:    string
  slug:         string
  institution:  any
  animals:      any[]
  fundraisers:  any[]
  articles:     any[]
}

const accent = '#E8634A'

export function InstitutionTabs({
  tabs, activeTab, slug, institution: i,
  animals, fundraisers, articles,
}: InstitutionTabsProps) {
  const router = useRouter()
  const [animalStatusFilter, setAnimalStatusFilter] = useState('')
  const [animalSearch, setAnimalSearch] = useState('')
  const [animalSuggestOpen, setAnimalSuggestOpen] = useState(false)
  const [sexFilter, setSexFilter]         = useState('')
  const [ageFilter, setAgeFilter]         = useState('')
  const [sizeFilter, setSizeFilter]       = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [showAdvanced, setShowAdvanced]   = useState(false)

  const setTab = (id: string) => router.push(`/institutions/${slug}?tab=${id}`, { scroll: false })

  // ── Derived lists for filters ──
  const speciesList = Array.from(
    new Map(animals.map(a => [a.species?.name_cs, a.species] as [string, any]).filter(([k]) => k)).values()
  ) as { id: string; name_cs: string; icon: string | null }[]

  const hasMultipleSpecies = speciesList.length > 1

  // ── Filtering logic ──
  const currentYear = new Date().getFullYear()
  const filteredAnimals = animals.filter(a => {
    const q   = animalSearch.toLowerCase().trim()
    const age = a.birth_year ? currentYear - a.birth_year : null

    if (animalStatusFilter && a.adoption_status !== animalStatusFilter) return false
    if (q && ![a.name, a.breed, a.species?.name_cs].some((v: any) => v?.toLowerCase().includes(q))) return false
    if (sexFilter && a.sex !== sexFilter) return false
    if (sizeFilter && a.size !== sizeFilter) return false
    if (speciesFilter && a.species?.name_cs !== speciesFilter) return false
    if (ageFilter === 'young'  && !(age !== null && age <= 2)) return false
    if (ageFilter === 'adult'  && !(age !== null && age > 2 && age <= 8)) return false
    if (ageFilter === 'senior' && !(age !== null && age > 8)) return false
    return true
  })

  const advancedActiveCount = [sexFilter, ageFilter, sizeFilter, speciesFilter].filter(Boolean).length
  // Na mobilu počítáme i statusový filtr (pills jsou schované pod Filtry)
  const mobileAdvancedCount = advancedActiveCount + (animalStatusFilter ? 1 : 0)

  const clearAllFilters = () => {
    setAnimalStatusFilter('')
    setAnimalSearch('')
    setSexFilter('')
    setAgeFilter('')
    setSizeFilter('')
    setSpeciesFilter('')
  }

  return (
    <div>
      {/* Tab navigace */}
      <div className="relative mb-6 px-4 md:px-0">
        <div>
          <div className="flex gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-b-2xl"
            style={{ background: '#F0EDE8' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className="flex items-center justify-center gap-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold cursor-pointer border-none whitespace-nowrap transition-all rounded-xl flex-1"
                style={activeTab === tab.id
                  ? { background: 'white', color: accent, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }
                  : { background: 'transparent', color: '#8B6550' }
                }
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="hidden sm:inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                    style={activeTab === tab.id
                      ? { background: accent, color: 'white' }
                      : { background: 'rgba(0,0,0,0.08)', color: '#8B6550' }
                    }>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Obsah tabů */}
      <div className="px-4 md:px-0">

      {/* ── Tab: Zvířata ── */}
      {activeTab === 'animals' && (
        <div>
          {animals.length === 0 ? (
            <EmptyTab icon="🐾" text="Zatím žádná zvířata k adopci." />
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={animalSearch}
                  onChange={e => { setAnimalSearch(e.target.value); setAnimalSuggestOpen(true) }}
                  onFocus={() => setAnimalSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setAnimalSuggestOpen(false), 150)}
                  placeholder="Hledat jméno, rasu, druh…"
                  className="w-full pl-9 pr-9 py-2.5 text-sm border-2 rounded-xl outline-none transition-colors bg-white"
                  style={{ borderColor: '#F0EDE8', color: '#1A0F0A' }}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B6550" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                {animalSearch && (
                  <button onClick={() => setAnimalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold cursor-pointer border-none bg-transparent"
                    style={{ color: '#8B6550' }}>✕</button>
                )}
                {animalSuggestOpen && (() => {
                  const q = animalSearch.toLowerCase().trim()
                  const suggs = q.length < 1 ? [] : Array.from(new Set([
                    ...animals.map((a: any) => a.name).filter((v: any) => v?.toLowerCase().includes(q) && v.toLowerCase() !== q),
                    ...animals.map((a: any) => a.breed).filter((v: any): v is string => !!v && v.toLowerCase().includes(q) && v.toLowerCase() !== q),
                  ])).slice(0, 5)
                  return suggs.length > 0 ? (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#F0EDE8] rounded-xl shadow-lg z-20 overflow-hidden">
                      {suggs.map((s: any) => (
                        <button key={s} onMouseDown={() => { setAnimalSearch(s); setAnimalSuggestOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#FDF8F5] cursor-pointer border-none bg-transparent"
                          style={{ color: '#1A0F0A' }}>🔍 {s}</button>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>

              {/* Status pills + Filtry */}
              {(() => {
                const statusCfg: Record<string, { label: string; shortLabel: string }> = {
                  available:   { label: 'K adopci',        shortLabel: 'K adopci' },
                  reserved:    { label: 'Rezervováno',     shortLabel: 'Rezerv.' },
                  foster:      { label: 'Dočasná péče',    shortLabel: 'Dočasná' },
                  conditional: { label: 'Podmíněná',       shortLabel: 'Podmín.' },
                }
                const present = Object.keys(statusCfg).filter(s => animals.some((a: any) => a.adoption_status === s))
                const showPills = present.length > 1
                return (
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Status pills — pouze desktop */}
                    <div className="hidden sm:flex flex-wrap gap-1.5">
                      {showPills && (
                        <>
                          <button onClick={() => setAnimalStatusFilter('')}
                            className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer min-h-[32px]"
                            style={!animalStatusFilter ? { background: accent, color: 'white', borderColor: accent } : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }}>
                            Vše ({animals.length})
                          </button>
                          {present.map(s => {
                            const cnt = animals.filter((a: any) => a.adoption_status === s).length
                            return (
                              <button key={s} onClick={() => setAnimalStatusFilter(s === animalStatusFilter ? '' : s)}
                                className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer min-h-[32px]"
                                style={animalStatusFilter === s ? { background: accent, color: 'white', borderColor: accent } : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }}>
                                <span className="hidden sm:inline">{statusCfg[s].label}</span>
                                <span className="sm:hidden">{statusCfg[s].shortLabel}</span>
                                <span className="ml-1 opacity-70">({cnt})</span>
                              </button>
                            )
                          })}
                        </>
                      )}
                    </div>

                    {/* Advanced filter toggle — mobil: full width, desktop: right-aligned */}
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex-shrink-0 flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer min-h-[32px] w-full sm:w-auto"
                      style={showAdvanced || mobileAdvancedCount > 0
                        ? { background: accent, color: 'white', borderColor: accent }
                        : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      {/* Na mobilu zobrazujeme mobileAdvancedCount (včetně statusu), na desktopu jen advancedActiveCount */}
                      <span className="sm:hidden">Filtry{mobileAdvancedCount > 0 ? ` · ${mobileAdvancedCount}` : ''}</span>
                      <span className="hidden sm:inline">Filtry{advancedActiveCount > 0 ? ` · ${advancedActiveCount}` : ''}</span>
                    </button>
                  </div>
                )
              })()}

              {/* Advanced filters panel */}
              {showAdvanced && (
                <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: '#FAFAF8', border: '1px solid #F0EDE8' }}>

                  {/* Status — jen na mobilu (na desktopu jsou pills venku) */}
                  {(() => {
                    const statusCfg: Record<string, { label: string }> = {
                      available:   { label: 'K adopci' },
                      reserved:    { label: 'Rezervováno' },
                      foster:      { label: 'Dočasná péče' },
                      conditional: { label: 'Podmíněná' },
                    }
                    const present = Object.keys(statusCfg).filter(s => animals.some((a: any) => a.adoption_status === s))
                    return present.length > 1 ? (
                      <div className="sm:hidden">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8B6550' }}>Stav</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => setAnimalStatusFilter('')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all"
                            style={!animalStatusFilter ? { background: accent, color: 'white', borderColor: accent } : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }}>
                            Vše ({animals.length})
                          </button>
                          {present.map(s => {
                            const cnt = animals.filter((a: any) => a.adoption_status === s).length
                            return (
                              <button key={s} onClick={() => setAnimalStatusFilter(s === animalStatusFilter ? '' : s)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all"
                                style={animalStatusFilter === s ? { background: accent, color: 'white', borderColor: accent } : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }}>
                                {statusCfg[s].label} ({cnt})
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null
                  })()}

                  {/* Species — only if multiple */}
                  {hasMultipleSpecies && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8B6550' }}>Druh</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setSpeciesFilter('')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all"
                          style={!speciesFilter ? { background: accent, color: 'white', borderColor: accent } : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }}>
                          Všechny
                        </button>
                        {speciesList.map((s: any) => (
                          <button key={s.name_cs} onClick={() => setSpeciesFilter(speciesFilter === s.name_cs ? '' : s.name_cs)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all"
                            style={speciesFilter === s.name_cs ? { background: accent, color: 'white', borderColor: accent } : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }}>
                            {s.icon} {s.name_cs}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sex */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8B6550' }}>Pohlaví</p>
                    <div className="flex gap-2">
                      {[
                        { v: '',       label: 'Nezáleží' },
                        { v: 'male',   label: '♂ Samec' },
                        { v: 'female', label: '♀ Samice' },
                      ].map(({ v, label }) => (
                        <button key={label} onClick={() => setSexFilter(v)}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all text-center min-h-[36px]"
                          style={sexFilter === v
                            ? { background: v === 'male' ? '#E6F1FB' : v === 'female' ? '#FDE8F3' : '#FAECE7', borderColor: v === 'male' ? '#4A9EE0' : v === 'female' ? '#E040A0' : accent, color: v === 'male' ? '#185FA5' : v === 'female' ? '#B01060' : '#993C1D' }
                            : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age + Size */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8B6550' }}>Věk</p>
                      <div className="flex flex-col gap-1">
                        {[
                          { v: '',       label: 'Jakýkoliv' },
                          { v: 'young',  label: '🐣 Do 2 let' },
                          { v: 'adult',  label: '🐕 2–8 let' },
                          { v: 'senior', label: '🦮 Senior 8+' },
                        ].map(({ v, label }) => (
                          <button key={label} onClick={() => setAgeFilter(v)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all text-left min-h-[32px]"
                            style={ageFilter === v ? { background: '#FAECE7', borderColor: accent, color: '#993C1D' } : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8B6550' }}>Velikost</p>
                      <div className="flex flex-col gap-1">
                        {[
                          { v: '',       label: 'Jakákoliv' },
                          { v: 'small',  label: '🐾 Malý' },
                          { v: 'medium', label: '🐕 Střední' },
                          { v: 'large',  label: '🐕‍🦺 Velký' },
                          { v: 'xlarge', label: '🦣 Extra velký' },
                        ].map(({ v, label }) => (
                          <button key={label} onClick={() => setSizeFilter(v)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all text-left min-h-[32px]"
                            style={sizeFilter === v ? { background: '#FAECE7', borderColor: accent, color: '#993C1D' } : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clear advanced */}
                  {advancedActiveCount > 0 && (
                    <button onClick={clearAllFilters}
                      className="w-full py-2 rounded-lg text-xs font-bold border-none cursor-pointer"
                      style={{ background: '#F0EDE8', color: '#6B4030' }}>
                      Zrušit všechny filtry
                    </button>
                  )}
                </div>
              )}

              {/* Result count */}
              <p className="text-xs mb-4" style={{ color: '#8B6550' }}>
                {filteredAnimals.length === animals.length
                  ? `${animals.length} zvířat`
                  : `${filteredAnimals.length} z ${animals.length} zvířat`}
              </p>

              {/* Empty filtered state */}
              {filteredAnimals.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm font-semibold mb-2" style={{ color: '#1A0F0A' }}>Žádný výsledek</p>
                  <button onClick={clearAllFilters}
                    className="text-xs font-bold cursor-pointer border-none bg-transparent"
                    style={{ color: accent }}>Zrušit filtry</button>
                </div>
              )}

              {/* Animal grid */}
              {filteredAnimals.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredAnimals.map((a: any, idx: number) => {
                    const age       = a.birth_year ? currentYear - a.birth_year : null
                    const ageLabel  = age === null ? null : age === 0 ? 'Mládě' : age === 1 ? '1 rok' : `${age} let`
                    const sexIcon   = a.sex === 'male' ? '♂' : a.sex === 'female' ? '♀' : null
                    const statusCfgPhoto: Record<string, { label: string; bg: string }> = {
                      available:   { label: 'K adopci',       bg: 'rgba(34,107,17,0.85)' },
                      reserved:    { label: '⏳ Rezervováno', bg: 'rgba(133,79,11,0.85)' },
                      foster:      { label: '🏡 Dočasná péče', bg: 'rgba(15,110,86,0.85)' },
                      conditional: { label: '🤝 Podmíněná',   bg: 'rgba(192,80,0,0.85)' },
                    }
                    const sc = statusCfgPhoto[a.adoption_status]

                    return (
                      <React.Fragment key={a.id}>
                      <div className={`bg-white rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 ${a.urgent ? 'ring-2 shadow-md' : 'border border-[#F0EDE8] hover:border-[#E8634A]/30 hover:shadow-sm'}`}
                        style={a.urgent ? { boxShadow: `0 0 0 2px ${accent}40` } : {}}>
                        <Link href={`/animals/${a.id}`} className="no-underline group block">
                          <div className="relative h-36 md:h-40 overflow-hidden" style={{ background: '#F5E6D3' }}>
                            {a.primary_photo
                              ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, 25vw" />
                              : <div className="w-full h-full flex items-center justify-center text-5xl">{a.species?.icon ?? '🐾'}</div>
                            }
                            {a.urgent && (
                              <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: accent }}>
                                🆘 Urgentní
                              </div>
                            )}
                            {sc && !a.urgent && (
                              <div className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-sm"
                                style={{ background: sc.bg }}>
                                {sc.label}
                              </div>
                            )}
                            {a.urgent && sc && (
                              <div className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-sm"
                                style={{ background: sc.bg }}>
                                {sc.label}
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="p-3">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <Link href={`/animals/${a.id}`} className="no-underline min-w-0">
                              <span className="font-bold text-sm leading-tight block truncate" style={{ color: '#1A0F0A' }}>
                                {a.name}
                              </span>
                            </Link>
                            <FavoriteButton type="animal" id={a.id} size="sm" />
                          </div>

                          <p className="text-[11px] leading-tight mb-2 truncate" style={{ color: '#8B6550' }}>
                            {[a.species?.name_cs, a.breed, sexIcon, ageLabel].filter(Boolean).join(' · ')}
                          </p>

                          <div className="flex flex-wrap gap-1">
                            {a.vaccinated && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#EAF3DE', color: '#3B6D11' }}>💉 Očk.</span>
                            )}
                            {a.neutered && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#EAF3DE', color: '#3B6D11' }}>✂️ Kast.</span>
                            )}
                            {(a.good_with_kids === 'yes' || a.good_with_kids === 'ok' || a.good_with_kids === true) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FAECE7', color: '#993C1D' }}>👶</span>
                            )}
                            {(a.good_with_dogs === 'yes' || a.good_with_dogs === 'ok' || a.good_with_dogs === true) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#6B4030' }}>🐕</span>
                            )}
                            {(a.good_with_cats === 'yes' || a.good_with_cats === 'ok' || a.good_with_cats === true) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#6B4030' }}>🐱</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reklama každých 8 karet — mobil: 1 sloupec (jako karta), desktop: přes celou šířku */}
                      {filteredAnimals.length > 4 && (idx + 1) % 8 === 0 && (
                        <React.Fragment key={`ad-${idx}`}>
                          {/* Mobil: pill v 1 sloupci */}
                          <div className="col-span-1 sm:hidden">
                            <AdSlot slot="inline_grid" institutionId={i.id} />
                          </div>
                          {/* Desktop: banner přes celou šířku */}
                          <div className="hidden sm:block sm:col-span-3 lg:col-span-4">
                            <AdSlot slot="banner_animal" institutionId={i.id} />
                          </div>
                        </React.Fragment>
                      )}
                      </React.Fragment>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Sbírky ── */}
      {activeTab === 'fundraisers' && (
        <div>
          {fundraisers.length === 0 ? (
            <EmptyTab icon="💛" text="Zatím žádné sbírky." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fundraisers.map((f: any) => {
                const pct         = f.goal_amount > 0 ? Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100) : 0
                const isComplete  = pct >= 100
                const hasDarujme  = !!f.darujme_url
                const deadlineInfo = getDeadlineInfo(f.deadline)

                return (
                  <Link key={f.id} href={`/fundraisers/${f.id}`} className="no-underline group">
                    <div className="bg-white rounded-xl border border-[#F0EDE8] overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all h-full flex flex-col">
                      {/* Cover */}
                      {f.image_url && (
                        <div className="relative h-36 flex-shrink-0" style={{ background: '#F0EDE8' }}>
                          <Image src={f.image_url} alt={f.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" sizes="(max-width:640px) 100vw, 50vw" />
                        </div>
                      )}

                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="font-bold text-sm text-[#1A0F0A] leading-tight">{f.title}</div>
                          {!f.active && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: '#F0EDE8', color: '#8B6550' }}>Ukončená</span>
                          )}
                        </div>

                        {f.description && (
                          <p className="text-xs line-clamp-2 mb-3 flex-1" style={{ color: '#8B6550' }}>{f.description}</p>
                        )}

                        <div className="mt-auto">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-[#1A0F0A]">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                            <span style={{ color: '#8B6550' }}>z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#F0EDE8' }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: isComplete ? '#16a34a' : accent }} />
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span style={{ color: isComplete ? '#16a34a' : '#8B6550' }}>
                              {isComplete ? '🎉 Cíl splněn' : `${pct}%`}
                              {(f.darujme_donors_count ?? 0) > 0 && ` · ${f.darujme_donors_count} dárců`}
                            </span>
                            <div className="flex items-center gap-2">
                              {hasDarujme && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: '#fef3e2', color: '#92400e' }}>darujme.cz</span>
                              )}
                              {deadlineInfo && (
                                <span style={{ color: deadlineInfo.color }}>{deadlineInfo.label}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Příběhy ── */}
      {activeTab === 'stories' && (
        <div>
          {articles.length === 0 ? (
            <EmptyTab icon="📖" text="Zatím žádné příběhy." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {articles.map((a: any) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                  <div className="bg-white rounded-xl overflow-hidden border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-1 transition-all h-full flex flex-col">
                    <div className="h-36 relative overflow-hidden flex-shrink-0" style={{ background: '#FAECE7' }}>
                      {a.cover_url
                        ? <Image src={a.cover_url} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width:640px) 50vw, 33vw" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                      }
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="font-bold text-sm text-[#1A0F0A] mb-1.5 leading-tight line-clamp-2 flex-1">{a.title}</div>
                      {a.perex && (
                        <p className="text-xs line-clamp-2 mb-2 hidden md:block" style={{ color: '#8B6550' }}>{a.perex}</p>
                      )}
                      <div className="text-xs font-bold mt-auto" style={{ color: accent }}>Přečíst →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: O nás ── */}
      {activeTab === 'about' && (
        <div className="max-w-[720px] space-y-6">
          {/* Short description jako perex */}
          {i.short_description && (
            <p className="font-bold text-lg text-[#1A0F0A] leading-relaxed">
              {i.short_description}
            </p>
          )}

          {/* Popis */}
          {i.description ? (
            <p className="text-base leading-relaxed text-[#4A2C1A] whitespace-pre-line" style={{ lineHeight: 1.8 }}>
              {i.description}
            </p>
          ) : !i.short_description && (
            <EmptyTab icon="🏢" text="Popis instituce zatím není k dispozici." />
          )}

          {/* Provozní hodiny */}
          <OpeningHoursDisplay
            data={i.opening_hours_structured}
            fallbackText={i.opening_hours ?? null}
          />

          {/* Sociální sítě */}
          {(i.facebook_url || i.instagram_url) && (
            <div className="flex flex-wrap gap-3">
              {i.facebook_url && (
                <a href={i.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F0EDE8] bg-white text-sm font-bold no-underline hover:border-[#1877F2] hover:text-[#1877F2] transition-all"
                  style={{ color: '#4A2C1A' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
              )}
              {i.instagram_url && (
                <a href={i.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F0EDE8] bg-white text-sm font-bold no-underline hover:border-[#E1306C] hover:text-[#E1306C] transition-all"
                  style={{ color: '#4A2C1A' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Instagram
                </a>
              )}
            </div>
          )}

          {/* Newsletter odběr — přesunut sem z Kontaktu */}
          <div className="pt-2">
            <NewsletterSubscribe
              institutionId={i.id}
              institutionName={i.name}
            />
          </div>
        </div>
      )}

      {/* ── Tab: Kontakt + Mapa ── */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Kontaktní info */}
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-[#1A0F0A] mb-5">Kontaktní údaje</h2>

            {[
              { icon: '📍', label: 'Adresa',  value: [i.street, i.city, i.postal_code].filter(Boolean).join(', ') },
              { icon: '✉️', label: 'E-mail',  value: i.email,   href: `mailto:${i.email}` },
              { icon: '📞', label: 'Telefon', value: i.phone,   href: `tel:${i.phone}` },
              { icon: '🌐', label: 'Web',     value: i.website?.replace(/^https?:\/\//, ''), href: i.website },
            ].filter(c => c.value).map(({ icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#F0EDE8]">
                <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>{label}</div>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined}
                      className="text-sm font-medium no-underline hover:opacity-70 transition-opacity"
                      style={{ color: accent }}>
                      {value}
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-[#1A0F0A]">{value}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Sociální sítě */}
            {(i.facebook_url || i.instagram_url) && (
              <div className="flex flex-wrap gap-3 pt-1">
                {i.facebook_url && (
                  <a href={i.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F0EDE8] bg-white text-sm font-bold no-underline hover:border-[#1877F2] hover:text-[#1877F2] transition-all"
                    style={{ color: '#4A2C1A' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                )}
                {i.instagram_url && (
                  <a href={i.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F0EDE8] bg-white text-sm font-bold no-underline hover:border-[#E1306C] hover:text-[#E1306C] transition-all"
                    style={{ color: '#4A2C1A' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram
                  </a>
                )}
              </div>
            )}

            {/* Google Maps odkaz */}
            {i.lat && i.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${i.lat},${i.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white no-underline hover:opacity-90 transition-all"
                style={{ background: accent }}
              >
                🗺️ Navigovat v Google Maps
              </a>
            )}

          </div>

          {/* Mapa */}
          {i.lat && i.lng ? (
            <div>
              <h2 className="font-bold text-xl text-[#1A0F0A] mb-5">Kde nás najdete</h2>
              <div className="rounded-xl overflow-hidden border border-[#F0EDE8] shadow-sm">
                <iframe
                  src={`https://frame.mapy.cz/zakladni?x=${i.lng}&y=${i.lat}&z=15&source=coor&id=${i.lng}%2C${i.lat}`}
                  width="100%"
                  height="320"
                  style={{ border: 'none', display: 'block' }}
                  title={`Mapa — ${i.name}`}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-[#E0DDD8]">
              <p className="text-sm text-center" style={{ color: '#8B6550' }}>
                Mapa není k dispozici.<br />
                <span className="text-xs">Správce musí doplnit souřadnice.</span>
              </p>
            </div>
          )}
        </div>
      )}
      </div>{/* end obsah tabů */}
    </div>
  )
}

/* ── Helpers ── */

function getDeadlineInfo(deadline: string | null) {
  if (!deadline) return null
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (days < 0)   return { label: 'Ukončena',     color: '#8B6550' }
  if (days === 0) return { label: 'Dnes končí!',  color: '#E8634A' }
  if (days <= 3)  return { label: `${days} dny!`, color: '#E8634A' }
  if (days <= 7)  return { label: `${days} dní`,  color: '#F0A500' }
  return { label: new Date(deadline).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' }), color: '#8B6550' }
}

function EmptyTab({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-sm" style={{ color: '#8B6550' }}>{text}</p>
    </div>
  )
}
