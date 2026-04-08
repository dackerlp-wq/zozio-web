'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FavoriteButton } from '@/components/public/FavoriteButton'
import { VolunteerRegisterModal } from '@/components/public/VolunteerRegisterModal'
import { AccountSettings } from '@/components/public/AccountSettings'

const activityLabel: Record<string, string> = {
  walking:     '🦮 Venčení',
  socializing: '🐱 Socializace',
  events:      '🎪 Akce',
  transport:   '🚗 Přeprava',
  care:        '🤝 Péče',
  fostering:   '🏡 Foster',
  admin:       '📷 Foto & sítě',
  other:       '✏️ Jiné',
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: '⏳ Čeká',     bg: '#FAEEDA', color: '#854F0B' },
  active:   { label: '✓ Aktivní',   bg: '#EAF3DE', color: '#3B6D11' },
  inactive: { label: '○ Neaktivní', bg: '#F5F5F5', color: '#6B6B6B' },
  rejected: { label: '✗ Zamítnuto', bg: '#FAECE7', color: '#993C1D' },
}

const adoptionLabel: Record<string, string> = {
  available:        'K adopci',
  reserved:         'Rezervováno',
  adopted:          'Adoptováno',
  not_for_adoption: 'Není k adopci',
}

type Tab = 'feed' | 'animals' | 'institutions' | 'volunteering' | 'settings'

interface Props {
  user: { email: string; user_metadata?: { full_name?: string; phone?: string } }
  favAnimals: any[]
  favInstitutions: any[]
  volunteers: any[]
  newAnimals: any[]
  newRescueCases: any[]
  newArticles: any[]
  newsletterSubscribed: boolean
}

export function ProfilTabs({ user, favAnimals, favInstitutions, volunteers, newAnimals, newRescueCases, newArticles, newsletterSubscribed }: Props) {
  const [tab, setTab] = useState<Tab>('feed')
  const [showVolunteerModal, setShowVolunteerModal] = useState(false)

  const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'příteli'
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const hasFeed = newAnimals.length + newRescueCases.length + newArticles.length > 0
  const pendingVolunteers = volunteers.filter((v: any) => v.status === 'pending').length

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'feed',         icon: '🔔', label: 'Aktuality',      count: hasFeed ? newAnimals.length + newRescueCases.length + newArticles.length : 0 },
    { id: 'animals',      icon: '🐾', label: 'Zvířata',        count: favAnimals.length },
    { id: 'institutions', icon: '🏛',  label: 'Instituce',     count: favInstitutions.length },
    { id: 'volunteering', icon: '🙋', label: 'Dobrovolnictví', count: volunteers.length },
    { id: 'settings',     icon: '⚙️', label: 'Nastavení' },
  ]

  return (
    <>
      {/* Avatar + info */}
      <div className="py-6 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-display font-extrabold text-xl text-white flex-shrink-0"
          style={{ background: '#E8634A' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-extrabold text-xl text-[#1A0F0A] truncate">
            Ahoj, {name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm truncate" style={{ color: '#8B6550' }}>{user.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/adopt"
            className="hidden sm:inline-flex px-4 py-2 rounded-[100px] text-sm font-bold no-underline border hover:opacity-80 transition-all"
            style={{ borderColor: '#E8634A', color: '#E8634A', background: 'white' }}>
            + Najít zvíře
          </Link>
          <form action="/auth/logout" method="POST">
            <button type="submit"
              className="px-4 py-2 rounded-[100px] text-sm font-bold border cursor-pointer bg-white hover:opacity-80 transition-all"
              style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
              Odhlásit
            </button>
          </form>
        </div>
      </div>

      {/* Tab navigace */}
      <div className="flex border-b border-[#F0EDE8] -mx-5 px-5 overflow-x-auto gap-1 flex-shrink-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all flex-shrink-0"
            style={tab === t.id
              ? { color: '#E8634A', borderColor: '#E8634A' }
              : { color: '#8B6550', borderColor: 'transparent' }
            }
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {(t.count ?? 0) > 0 && (
              <span
                className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: '#E8634A' }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab obsah */}
      <div className="py-5">

        {/* ── Feed ── */}
        {tab === 'feed' && (
          <section>
            {!hasFeed ? (
              <div className="text-center py-14">
                <div className="text-4xl mb-3">🔔</div>
                <p className="font-bold text-[#1A0F0A] mb-1">Zatím žádné aktuality</p>
                <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
                  Sleduj útulky a záchranné stanice — uvidíš jejich nová zvířata a příběhy.
                </p>
                <Link href="/institutions"
                  className="inline-flex px-5 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
                  style={{ background: '#E8634A' }}>
                  Najít útulek →
                </Link>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Zvířata k adopci — karty */}
                {newAnimals.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 px-0.5" style={{ color: '#8B6550' }}>🐾 Nová zvířata k adopci</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {newAnimals.slice(0, 4).map((a: any) => (
                        <Link key={a.id} href={`/animals/${a.id}`} className="no-underline group">
                          <div className="bg-white rounded-xl border border-[#F0EDE8] overflow-hidden hover:-translate-y-0.5 transition-all">
                            <div className="h-32 relative flex items-center justify-center" style={{ background: '#FAECE7' }}>
                              {a.primary_photo
                                ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                : <span className="text-3xl">{a.species?.icon ?? '🐾'}</span>
                              }
                            </div>
                            <div className="p-2.5">
                              <div className="font-bold text-xs text-[#1A0F0A] truncate">{a.name}</div>
                              <div className="text-[10px] truncate mt-0.5" style={{ color: '#8B6550' }}>
                                {a.species?.name_cs} · {a.institution?.name}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Záchranné případy — karty */}
                {newRescueCases.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 px-0.5" style={{ color: '#8B6550' }}>🚑 Záchranné případy</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {newRescueCases.slice(0, 4).map((rc: any) => (
                        <Link key={rc.id} href={`/rescue-cases/${rc.id}`} className="no-underline group">
                          <div className="bg-white rounded-xl border border-[#F0EDE8] overflow-hidden hover:-translate-y-0.5 transition-all">
                            <div className="h-32 relative flex items-center justify-center" style={{ background: '#E1F5EE' }}>
                              {rc.primary_photo
                                ? <Image src={rc.primary_photo} alt={rc.name ?? rc.case_number} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                : <span className="text-3xl">{rc.species?.icon ?? '🦉'}</span>
                              }
                            </div>
                            <div className="p-2.5">
                              <div className="font-bold text-xs text-[#1A0F0A] truncate">{rc.name ?? rc.case_number}</div>
                              <div className="text-[10px] truncate mt-0.5" style={{ color: '#8B6550' }}>
                                {rc.species?.name_cs} · {rc.institution?.name}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nejnovější články — seznam */}
                {newArticles.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 px-0.5" style={{ color: '#8B6550' }}>📖 Nové příběhy</p>
                    <div className="bg-white rounded-xl border border-[#F0EDE8] divide-y divide-[#F0EDE8] overflow-hidden">
                      {newArticles.slice(0, 4).map((a: any) => (
                        <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                          <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#FAFAF8] transition-all">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center"
                              style={{ background: '#FAEEDA' }}>
                              {a.cover_url
                                ? <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                                : <span className="text-xl">📖</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] truncate mb-0.5" style={{ color: '#8B6550' }}>{a.institution?.name}</div>
                              <div className="font-semibold text-sm text-[#1A0F0A] line-clamp-1">{a.title}</div>
                              {a.perex && <div className="text-xs line-clamp-1 mt-0.5" style={{ color: '#8B6550' }}>{a.perex}</div>}
                            </div>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </section>
        )}

        {/* ── Zvířata ── */}
        {tab === 'animals' && (
          <section>
            {!favAnimals.length ? (
              <div className="text-center py-14">
                <div className="text-4xl mb-3">🐾</div>
                <p className="font-bold text-[#1A0F0A] mb-1">Žádná oblíbená zvířata</p>
                <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
                  Klikni na ❤️ u zvířete a uloží se sem.
                </p>
                <Link href="/adopt"
                  className="inline-flex px-5 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
                  style={{ background: '#E8634A' }}>
                  Hledat zvíře →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {favAnimals.map((f: any) => {
                  const a = f.animal
                  return (
                    <Link key={a.id} href={`/animals/${a.id}`} className="no-underline group">
                      <div className="rounded-xl overflow-hidden border border-[#F0EDE8] hover:-translate-y-0.5 transition-all relative bg-white">
                        <div className="h-36 relative flex items-center justify-center" style={{ background: '#FAECE7' }}>
                          {a.primary_photo
                            ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <span className="text-4xl">{a.species?.icon ?? '🐾'}</span>
                          }
                          <div className="absolute top-2 right-2">
                            <FavoriteButton type="animal" id={a.id} initialFav size="sm" />
                          </div>
                          {a.adoption_status !== 'available' && (
                            <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-[10px] font-bold text-white"
                              style={{ background: 'rgba(0,0,0,0.5)' }}>
                              {adoptionLabel[a.adoption_status]}
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="font-bold text-sm text-[#1A0F0A] truncate">{a.name}</div>
                          <div className="text-xs truncate" style={{ color: '#8B6550' }}>
                            {a.species?.name_cs} · {a.institution?.city}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Instituce ── */}
        {tab === 'institutions' && (
          <section>
            {!favInstitutions.length ? (
              <div className="text-center py-14">
                <div className="text-4xl mb-3">🏛</div>
                <p className="font-bold text-[#1A0F0A] mb-1">Žádné sledované instituce</p>
                <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
                  Sleduj útulky a vidíš jejich aktuality v přehledu.
                </p>
                <Link href="/institutions"
                  className="inline-flex px-5 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
                  style={{ background: '#E8634A' }}>
                  Najít útulek →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {favInstitutions.map((f: any) => {
                  const inst = f.institution
                  const isShelter = inst.type === 'shelter'
                  return (
                    <div key={inst.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#F0EDE8]">
                      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-xl relative"
                        style={{ background: isShelter ? '#FAECE7' : '#E1F5EE' }}>
                        {inst.logo_url
                          ? <Image src={inst.logo_url} alt={inst.name} fill className="object-cover" />
                          : <span>{isShelter ? '🏠' : '🚑'}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/institutions/${inst.slug}`}
                          className="font-bold text-sm text-[#1A0F0A] truncate block no-underline hover:opacity-70">
                          {inst.name}
                        </Link>
                        <div className="text-xs" style={{ color: '#8B6550' }}>
                          📍 {inst.city} · {isShelter ? 'Útulek' : 'Záchranná stanice'}
                        </div>
                      </div>
                      <FavoriteButton type="institution" id={inst.id} initialFav size="sm" />
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Dobrovolnictví ── */}
        {tab === 'volunteering' && (
          <section>
            {/* CTA — velké tlačítko */}
            <button
              onClick={() => setShowVolunteerModal(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed mb-5 hover:opacity-80 transition-all"
              style={{ borderColor: '#E8634A', background: '#FDEAE6' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#E8634A', color: 'white' }}>
                +
              </div>
              <div className="text-left">
                <div className="font-bold text-sm" style={{ color: '#993C1D' }}>Přihlásit se jako dobrovolník</div>
                <div className="text-xs" style={{ color: '#C85A35' }}>Vyber organizaci a řekni co umíš</div>
              </div>
            </button>

            {!volunteers.length ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🙌</div>
                <p className="font-bold text-[#1A0F0A] mb-1">Zatím žádné přihlášky</p>
                <p className="text-sm" style={{ color: '#8B6550' }}>
                  Pomáhej útulkům a záchranným stanicím — zvířata i lidé to ocení.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {volunteers.map((v: any) => {
                  const inst = v.institution
                  const st = statusConfig[v.status ?? 'pending'] ?? statusConfig['pending']
                  const isShelter = inst?.type === 'shelter'
                  return (
                    <div key={v.id} className="bg-white rounded-xl border border-[#F0EDE8] overflow-hidden">
                      <div className="flex items-center gap-3 p-4 border-b border-[#F0EDE8]">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg overflow-hidden relative"
                          style={{ background: isShelter ? '#FAECE7' : '#E1F5EE' }}>
                          {inst?.logo_url
                            ? <Image src={inst.logo_url} alt={inst.name} fill className="object-cover" />
                            : <span>{isShelter ? '🏠' : '🚑'}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/institutions/${inst?.slug}`}
                            className="font-bold text-sm text-[#1A0F0A] block truncate no-underline hover:opacity-70">
                            {inst?.name}
                          </Link>
                          <div className="text-xs" style={{ color: '#8B6550' }}>
                            📍 {inst?.city} · Přihlášen {new Date(v.created_at).toLocaleDateString('cs-CZ')}
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-[100px] flex-shrink-0"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </div>

                      {/* Aktivity */}
                      {(v.activities?.length > 0) && (
                        <div className="px-4 py-3 flex flex-wrap gap-1.5">
                          {v.activities.map((a: string) => (
                            <span key={a} className="px-2.5 py-1 rounded-[100px] text-xs font-semibold"
                              style={{ background: '#F5E6D3', color: '#6B4030' }}>
                              {activityLabel[a] ?? a}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dostupnost */}
                      {v.availability_data && (
                        <div className="px-4 pb-3 text-xs" style={{ color: '#8B6550' }}>
                          {v.availability_data.days?.join(', ')}
                          {v.availability_data.frequency && ` · ${
                            { occasional: 'Příležitostně', regular: 'Pravidelně', flexible: 'Flexibilně' }[v.availability_data.frequency as string] ?? v.availability_data.frequency
                          }`}
                        </div>
                      )}

                      {/* Kontakt při schválení */}
                      {v.status === 'active' && inst?.slug && (
                        <div className="px-4 pb-3">
                          <Link href={`/institutions/${inst.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold no-underline hover:opacity-70"
                            style={{ color: '#E8634A' }}>
                            Zobrazit profil instituce →
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Nastavení ── */}
        {tab === 'settings' && (
          <AccountSettings
            user={user}
            newsletterSubscribed={newsletterSubscribed}
          />
        )}
      </div>

      {/* Rychlé akce — mobilní spodní řádek (skryj na nastavení) */}
      <div className={`sm:hidden grid grid-cols-3 gap-2 pb-4 ${tab === 'settings' ? 'hidden' : ''}`}>
        <Link href="/adopt"
          className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-[#F0EDE8] no-underline hover:opacity-80 transition-all">
          <span className="text-2xl">🐾</span>
          <span className="text-[10px] font-bold text-[#1A0F0A] text-center">Adopce</span>
        </Link>
        <Link href="/rescue"
          className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-[#F0EDE8] no-underline hover:opacity-80 transition-all">
          <span className="text-2xl">🦉</span>
          <span className="text-[10px] font-bold text-[#1A0F0A] text-center">Záchranné stanice</span>
        </Link>
        <Link href="/fundraisers"
          className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-[#F0EDE8] no-underline hover:opacity-80 transition-all">
          <span className="text-2xl">💛</span>
          <span className="text-[10px] font-bold text-[#1A0F0A] text-center">Sbírky</span>
        </Link>
      </div>

      {/* Volunteer modal */}
      {showVolunteerModal && (
        <VolunteerRegisterModal
          onClose={() => setShowVolunteerModal(false)}
          userEmail={user.email ?? ''}
          userName={name}
        />
      )}
    </>
  )
}
