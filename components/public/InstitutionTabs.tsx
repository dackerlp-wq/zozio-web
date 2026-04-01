'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Institution, Animal, AnimalSpecies, RescueCase, Fundraiser, Article } from '@/types/database'

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

export function InstitutionTabs({
  tabs, activeTab, slug, institution: i,
  isShelter, animals, rescueCases, fundraisers, articles,
}: InstitutionTabsProps) {
  const router = useRouter()

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
                </Link>
              ))}
            </div>
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
                      <div className="absolute top-2 left-2">
                        <RescueStatusPill status={c.status} />
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
                        ? <Image src={a.cover_url} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
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
        <div className="max-w-[720px]">
          {i.description ? (
            <p className="text-base leading-relaxed text-espresso" style={{ lineHeight: 1.8 }}>
              {i.description}
            </p>
          ) : (
            <EmptyTab icon="🏢" text="Popis instituce zatím není k dispozici." />
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
              { icon: '📍', label: 'Adresa',    value: [i.street, i.city, i.postal_code].filter(Boolean).join(', ') },
              { icon: '✉️', label: 'E-mail',    value: i.email,   href: `mailto:${i.email}` },
              { icon: '📞', label: 'Telefon',   value: i.phone,   href: `tel:${i.phone}` },
              { icon: '🌐', label: 'Web',       value: i.website?.replace(/^https?:\/\//, ''), href: i.website },
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

            {/* Google Maps odkaz */}
            {i.lat && i.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${i.lat},${i.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white no-underline hover:opacity-90 transition-all"
                style={{ background: isShelter ? 'var(--coral)' : 'var(--rescue)' }}
              >
                🗺️ Navigovat v Google Maps
              </a>
            )}
          </div>

          {/* Mapa */}
          {i.lat && i.lng ? (
            <div>
              <h2 className="font-bold text-xl text-text-primary mb-5">Kde nás najdete</h2>
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
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
            <div className="flex items-center justify-center h-48 rounded-2xl border border-dashed border-[#E0DDD8]">
              <p className="text-sm text-center text-text-muted">
                Mapa není k dispozici.<br />
                <span className="text-xs">Správce musí doplnit souřadnice.</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Helper komponenty ── */

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
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
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
