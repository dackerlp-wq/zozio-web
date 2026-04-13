'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Institution, Animal, AnimalSpecies, RescueCase, Fundraiser, Article } from '@/types/database'
import { InstitutionMap } from '@/components/public/InstitutionMap'

interface Tab { id: string; label: string; count: number | null }

type AnimalWithSpecies = Animal & { species?: AnimalSpecies }
type RescueCaseWithSpecies = RescueCase & { species?: AnimalSpecies }

interface InstitutionTabsProps {
  tabs:         Tab[]
  activeTab:    string
  slug:         string
  institution:  Institution
  isShelter:    boolean
  animals:      AnimalWithSpecies[]
  rescueCases:  RescueCaseWithSpecies[]
  fundraisers:  Fundraiser[]
  articles:     Article[]
}

const RESCUE_STATUSES = [
  { id: '',               label: 'Vše' },
  { id: 'intake',         label: 'Příjem' },
  { id: 'treatment',      label: 'Léčba' },
  { id: 'rehabilitation', label: 'Rehabilitace' },
  { id: 'released',       label: 'Propuštěn' },
  { id: 'transferred',    label: 'Přemístěn' },
]

export function InstitutionTabs({
  tabs, activeTab, slug, institution: i,
  isShelter, animals, rescueCases, fundraisers, articles,
}: InstitutionTabsProps) {
  const router = useRouter()
  const [rescueFilter, setRescueFilter] = useState('')
  const [animalStatusFilter, setAnimalStatusFilter] = useState('')
  const [animalSearch, setAnimalSearch] = useState('')
  const [animalSuggestOpen, setAnimalSuggestOpen] = useState(false)

  const accent = isShelter ? '#E8634A' : '#2E9E8F'

  const setTab = (id: string) => router.push(`/institutions/${slug}?tab=${id}`, { scroll: false })

  const activeColor = isShelter ? 'var(--coral)' : 'var(--rescue)'
  const activeBadgeBg = isShelter ? 'var(--coral)' : 'var(--rescue)'

  return (
    <div>
      {/* Tab navigace */}
      <div className="flex gap-0 border-b border-border mb-8 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold cursor-pointer border-none bg-transparent whitespace-nowrap transition-all border-b-2 -mb-px"
            style={activeTab === tab.id
              ? { color: activeColor, borderBottomColor: activeColor }
              : { color: 'var(--text-muted)', borderBottomColor: 'transparent' }
            }
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                style={activeTab === tab.id
                  ? { background: activeBadgeBg, color: 'white' }
                  : { background: 'var(--border)', color: 'var(--text-muted)' }
                }>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Obsah tabů */}
      <div className="px-4 md:px-0">

      {/* ── Tab: Zvířata ── */}
      {activeTab === 'animals' && (
        <div>
          {animals.length === 0 ? (
            <EmptyTab icon="🐾" text="Zatím žádná zvířata k adopci." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {animals.map(a => (
                <Link key={a.id} href={`/animals/${a.id}`} className="no-underline group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-border hover:border-coral/40 hover:-translate-y-1 transition-all">
                    <div className="relative h-36 overflow-hidden bg-coral-tag-bg">
                      {a.primary_photo
                        ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">{a.species?.icon ?? '🐾'}</div>
                      }
                      {a.urgent && (
                        <div className="absolute top-2 left-2 bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Urgentní</div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="font-bold text-sm text-text-primary truncate">{a.name}</div>
                        <StatusPill status={a.adoption_status} />
                      </div>
                      <div className="text-xs truncate text-text-muted">
                        {[a.species?.name_cs, a.breed].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                ) : null
              })()}

              {/* Vyhledávání s našeptávačem */}
              {(() => {
                const q = animalSearch.toLowerCase().trim()
                const suggestions = q.length < 1 ? [] : Array.from(new Set([
                  ...animals.map(a => a.name).filter(v => v?.toLowerCase().includes(q) && v.toLowerCase() !== q),
                  ...animals.map(a => a.breed).filter((v): v is string => !!v && v.toLowerCase().includes(q) && v.toLowerCase() !== q),
                  ...animals.map(a => a.species?.name_cs).filter((v): v is string => !!v && v.toLowerCase().includes(q) && v.toLowerCase() !== q),
                ])).slice(0, 6)

                return (
                  <div className="relative mb-5">
                    <input
                      type="text"
                      value={animalSearch}
                      onChange={e => { setAnimalSearch(e.target.value); setAnimalSuggestOpen(true) }}
                      onFocus={() => setAnimalSuggestOpen(true)}
                      onBlur={() => setTimeout(() => setAnimalSuggestOpen(false), 150)}
                      placeholder="Hledat podle jména, rasy, druhu…"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border-2 border-[#F0EDE8] rounded-xl outline-none focus:border-[#E8634A] transition-colors bg-white"
                      style={{ color: '#1A0F0A' }}
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B6550" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    {animalSearch && (
                      <button onClick={() => setAnimalSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold cursor-pointer border-none bg-transparent"
                        style={{ color: '#8B6550' }}>✕</button>
                    )}

                    {/* Dropdown */}
                    {animalSuggestOpen && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#F0EDE8] rounded-xl shadow-lg z-20 overflow-hidden">
                        {suggestions.map(s => (
                          <button
                            key={s}
                            onMouseDown={() => { setAnimalSearch(s); setAnimalSuggestOpen(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#FDF8F5] transition-colors cursor-pointer border-none bg-transparent flex items-center gap-2"
                            style={{ color: '#1A0F0A' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B6550" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                            </svg>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {(() => {
                const q = animalSearch.toLowerCase().trim()
                const filtered = animals.filter(a => {
                  const matchStatus = !animalStatusFilter || a.adoption_status === animalStatusFilter
                  const matchSearch = !q || [a.name, a.breed, a.species?.name_cs].some(v => v?.toLowerCase().includes(q))
                  return matchStatus && matchSearch
                })
                return filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-sm font-semibold" style={{ color: '#1A0F0A' }}>Žádný výsledek</p>
                    <button onClick={() => { setAnimalSearch(''); setAnimalStatusFilter('') }}
                      className="text-xs mt-2 cursor-pointer border-none bg-transparent font-semibold"
                      style={{ color: '#E8634A' }}>Zrušit filtry</button>
                  </div>
                ) : null
              })()}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {animals
                  .filter(a => {
                    const q = animalSearch.toLowerCase().trim()
                    const matchStatus = !animalStatusFilter || a.adoption_status === animalStatusFilter
                    const matchSearch = !q || [a.name, a.breed, a.species?.name_cs].some(v => v?.toLowerCase().includes(q))
                    return matchStatus && matchSearch
                  })
                  .map(a => {
                    const age = a.birth_year ? new Date().getFullYear() - a.birth_year : null
                    const ageLabel = age === null ? null : age === 0 ? 'Mládě' : age === 1 ? '1 rok' : `${age} let`
                    const sexLabel = a.sex === 'male' ? '♂' : a.sex === 'female' ? '♀' : null
                    const bgGradient = a.urgent ? 'from-[#FAECE7] to-[#F5E6D3]' : 'from-[#F5E6D3] to-[#FEF4D9]'

                    return (
                      <div key={a.id} className={`bg-white rounded-xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 ${a.urgent ? 'ring-2 ring-[#E8634A]/30' : 'border border-[#F0EDE8]'}`}>
                        <Link href={`/animals/${a.id}`} className="no-underline group block">
                          <div className={`relative h-36 md:h-40 bg-gradient-to-br ${bgGradient} flex items-center justify-center text-5xl overflow-hidden`}>
                            {a.primary_photo
                              ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, 25vw" />
                              : <span>{a.species?.icon ?? '🐾'}</span>
                            }
                            {/* Urgentní badge */}
                            {a.urgent && (
                              <div className="absolute top-2 left-2 bg-[#E8634A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                Urgentní
                              </div>
                            )}
                            {/* Status badge na fotce */}
                            <div className="absolute bottom-2 left-2">
                              <StatusPillPhoto status={a.adoption_status} />
                            </div>
                          </div>
                        </Link>

                        <div className="p-3">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <Link href={`/animals/${a.id}`} className="no-underline">
                              <span className="font-display font-extrabold text-sm text-[#1A0F0A] hover:text-[#E8634A] transition-colors leading-tight block">
                                {a.name}
                              </span>
                            </Link>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <FavoriteButton type="animal" id={a.id} size="sm" />
                            </div>
                          </div>

                          <p className="text-[11px] leading-tight mb-2 truncate" style={{ color: '#8B6550' }}>
                            {[
                              a.species?.name_cs,
                              a.breed,
                              sexLabel,
                              ageLabel,
                            ].filter(Boolean).join(' · ')}
                          </p>

                          {(a.good_with_kids || a.good_with_dogs || a.good_with_cats) && (
                            <div className="flex flex-wrap gap-1">
                              {a.good_with_kids && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FAECE7] text-[#993C1D]">👶 Děti</span>}
                              {a.good_with_dogs && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F0EDE8] text-[#6B4030]">🐕 Psi</span>}
                              {a.good_with_cats && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F0EDE8] text-[#6B4030]">🐱 Kočky</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Záchranné případy ── */}
      {activeTab === 'rescue' && (
        <div>
          {rescueCases.length === 0 ? (
            <EmptyTab icon="🦉" text="Zatím žádné záchranné případy." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rescueCases.map((c) => (
                <Link key={c.id} href={`/rescue/${c.id}`} className="no-underline group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-border hover:border-rescue/40 hover:-translate-y-1 transition-all">
                    <div className="relative h-40 overflow-hidden bg-rescue-tag-bg">
                      {c.primary_photo
                        ? <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">{c.species?.icon ?? '🐾'}</div>
                      }
                    >
                      {s.label} {cnt > 0 && <span className="ml-1 opacity-70">({cnt})</span>}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredRescue.map((c: any) => {
                  const daysIn = c.intake_date
                    ? Math.floor((Date.now() - new Date(c.intake_date).getTime()) / 86_400_000)
                    : null
                  return (
                    <Link key={c.id} href={`/rescue/${c.id}`} className="no-underline group">
                      <div className="bg-white rounded-xl overflow-hidden border border-[#F0EDE8] hover:border-[#2E9E8F]/40 hover:-translate-y-1 transition-all h-full flex flex-col">
                        <div className="relative h-36 md:h-40 overflow-hidden flex-shrink-0" style={{ background: '#E1F5EE' }}>
                          {c.primary_photo
                            ? <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, 33vw" />
                            : <div className="w-full h-full flex items-center justify-center text-5xl">{c.species?.icon ?? '🐾'}</div>
                          }
                          <div className="absolute top-2 left-2">
                            <RescueStatusPill status={c.status} />
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <div className="font-bold text-sm text-[#1A0F0A] mb-1 leading-tight">
                            {c.name ?? c.case_number}
                          </div>
                          <div className="text-xs" style={{ color: '#8B6550' }}>{c.species?.name_cs}</div>
                          {c.cause_of_injury && (
                            <div className="text-xs mt-1 line-clamp-1" style={{ color: '#6B4030' }}>{c.cause_of_injury}</div>
                          )}
                          {daysIn !== null && (
                            <div className="mt-auto pt-2 text-[11px]" style={{ color: '#8B6550' }}>
                              🏥 {daysIn === 0 ? 'Dnes přijat' : `${daysIn} dní ve stanici`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-bold text-sm text-text-primary mb-1">{c.name ?? c.case_number}</div>
                      <div className="text-xs text-text-muted">{c.species?.name_cs}</div>
                      {c.cause_of_injury && (
                        <div className="text-xs mt-1.5 line-clamp-1 text-text-body">{c.cause_of_injury}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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
              {fundraisers.map((f) => {
                const pct = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
                return (
                  <div key={f.id} className="bg-white rounded-2xl border border-border p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="font-bold text-text-primary mb-1">{f.title}</div>
                        {f.description && (
                          <p className="text-sm line-clamp-2 text-text-muted">{f.description}</p>
                        )}
                      </div>
                      {!f.active && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 bg-border text-text-muted">Ukončená</span>
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
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-text-primary">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                      <span className="text-text-muted">z {f.goal_amount.toLocaleString('cs-CZ')} Kč · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-border">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: isShelter ? 'var(--coral)' : 'var(--rescue)' }} />
                    </div>
                  </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-border hover:border-coral/40 hover:-translate-y-1 transition-all h-full flex flex-col">
                    <div className="h-40 relative overflow-hidden bg-coral-tag-bg">
                      {a.cover_url
                        ? <Image src={a.cover_url} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width:640px) 50vw, 33vw" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                      }
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="font-bold text-text-primary mb-2 leading-tight">{a.title}</div>
                      {a.perex && (
                        <p className="text-xs line-clamp-3 flex-1 text-text-muted">{a.perex}</p>
                      )}
                      <div className="mt-3 text-xs font-bold text-coral">Přečíst →</div>
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
            <p className="text-base leading-relaxed text-espresso" style={{ lineHeight: 1.8 }}>
              {i.description}
            </p>
          ) : !i.short_description && (
            <EmptyTab icon="🏢" text="Popis instituce zatím není k dispozici." />
          )}

          {/* Provozní hodiny */}
          {i.opening_hours && (
            <div className="bg-white rounded-xl border border-[#F0EDE8] p-5">
              <h3 className="font-bold text-sm text-[#1A0F0A] mb-3">🕐 Provozní hodiny</h3>
              <p className="text-sm text-[#4A2C1A] whitespace-pre-line leading-relaxed">
                {i.opening_hours}
              </p>
            </div>
          )}

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
        </div>
      )}

      {/* ── Tab: Kontakt + Mapa ── */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Kontaktní info */}
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-text-primary mb-5">Kontaktní údaje</h2>

            {[
              { icon: '📍', label: 'Adresa',  value: [i.street, i.city, i.postal_code].filter(Boolean).join(', ') },
              { icon: '✉️', label: 'E-mail',  value: i.email,   href: `mailto:${i.email}` },
              { icon: '📞', label: 'Telefon', value: i.phone,   href: `tel:${i.phone}` },
              { icon: '🌐', label: 'Web',     value: i.website?.replace(/^https?:\/\//, ''), href: i.website },
            ].filter(c => c.value).map(({ icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-border">
                <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-text-muted">{label}</div>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined}
                      className="text-sm font-medium no-underline hover:opacity-70 transition-opacity"
                      style={{ color: isShelter ? 'var(--coral)' : 'var(--rescue)' }}>
                      {value}
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-text-primary">{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mapa */}
          {i.lat && i.lng ? (
            <div>
              <h2 className="font-bold text-xl text-text-primary mb-5">📍 Kde nás najdete</h2>
              <InstitutionMap
                lat={i.lat}
                lng={i.lng}
                name={i.name}
                city={i.city}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-2xl border border-dashed border-border">
              <p className="text-sm text-center text-text-muted">
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
      <p className="text-sm text-text-muted">{text}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    available: { label: 'K adopci',    bg: 'var(--success-tag-bg)', color: 'var(--success-tag-text)' },
    reserved:  { label: 'Rezervováno', bg: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' },
    foster:    { label: 'Ve foster',   bg: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' },
  }
  const c = config[status]
  if (!c) return null
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function StatusPillPhoto({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    available: { label: '✓ K adopci',    bg: 'rgba(34,107,17,0.85)',  color: 'white' },
    reserved:  { label: '⏳ Rezervováno', bg: 'rgba(133,79,11,0.85)', color: 'white' },
    foster:    { label: '🏡 Ve foster',   bg: 'rgba(15,110,86,0.85)', color: 'white' },
  }
  const c = config[status]
  if (!c) return null
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function RescueStatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    intake:         { label: 'Příjem',        bg: 'var(--coral-tag-bg)', color: 'var(--coral-tag-text)' },
    treatment:      { label: 'Léčba',         bg: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' },
    rehabilitation: { label: 'Rehabilitace',  bg: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' },
    released:       { label: 'Propuštěn',     bg: 'var(--success-tag-bg)', color: 'var(--success-tag-text)' },
    transferred:    { label: 'Přemístěn',     bg: 'var(--border)', color: 'var(--text-neutral)' },
  }
  const c = config[status]
  if (!c) return null
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}
