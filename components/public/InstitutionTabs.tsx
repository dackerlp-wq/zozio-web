'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { NewsletterSubscribe } from './NewsletterSubscribe'

interface Tab { id: string; label: string; count: number | null }

interface InstitutionTabsProps {
  tabs:         Tab[]
  activeTab:    string
  slug:         string
  institution:  any
  isShelter:    boolean
  animals:      any[]
  rescueCases:  any[]
  fundraisers:  any[]
  articles:     any[]
}

export function InstitutionTabs({
  tabs, activeTab, slug, institution: i,
  isShelter, animals, rescueCases, fundraisers, articles,
}: InstitutionTabsProps) {
  const router = useRouter()

  const setTab = (id: string) => router.push(`/institutions/${slug}?tab=${id}`, { scroll: false })

  return (
    <div>
      {/* Tab navigace */}
      <div className="flex gap-0 border-b border-[#F0EDE8] mb-8 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold cursor-pointer border-none bg-transparent whitespace-nowrap transition-all border-b-2 -mb-px"
            style={activeTab === tab.id
              ? { color: isShelter ? '#E8634A' : '#2E9E8F', borderBottomColor: isShelter ? '#E8634A' : '#2E9E8F' }
              : { color: '#8B6550', borderBottomColor: 'transparent' }
            }
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                style={activeTab === tab.id
                  ? { background: isShelter ? '#E8634A' : '#2E9E8F', color: 'white' }
                  : { background: '#F0EDE8', color: '#8B6550' }
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
                  <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-1 transition-all">
                    <div className="relative h-36 overflow-hidden" style={{ background: '#FAECE7' }}>
                      {a.primary_photo
                        ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">{a.species?.icon ?? '🐾'}</div>
                      }
                      {a.urgent && (
                        <div className="absolute top-2 left-2 bg-[#E8634A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Urgentní</div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="font-bold text-sm text-[#1A0F0A] truncate">{a.name}</div>
                        <StatusPill status={a.adoption_status} />
                      </div>
                      <div className="text-xs truncate" style={{ color: '#8B6550' }}>
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
              {rescueCases.map((c: any) => (
                <Link key={c.id} href={`/rescue/${c.id}`} className="no-underline group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:border-[#2E9E8F]/40 hover:-translate-y-1 transition-all">
                    <div className="relative h-40 overflow-hidden" style={{ background: '#E1F5EE' }}>
                      {c.primary_photo
                        ? <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">{c.species?.icon ?? '🐾'}</div>
                      }
                      <div className="absolute top-2 left-2">
                        <RescueStatusPill status={c.status} />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-bold text-sm text-[#1A0F0A] mb-1">{c.name ?? c.case_number}</div>
                      <div className="text-xs" style={{ color: '#8B6550' }}>{c.species?.name_cs}</div>
                      {c.cause_of_injury && (
                        <div className="text-xs mt-1.5 line-clamp-1" style={{ color: '#6B4030' }}>{c.cause_of_injury}</div>
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
              {fundraisers.map((f: any) => {
                const pct = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
                return (
                  <div key={f.id} className="bg-white rounded-2xl border border-[#F0EDE8] p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="font-bold text-[#1A0F0A] mb-1">{f.title}</div>
                        {f.description && (
                          <p className="text-sm line-clamp-2" style={{ color: '#8B6550' }}>{f.description}</p>
                        )}
                      </div>
                      {!f.active && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                          style={{ background: '#F0EDE8', color: '#8B6550' }}>Ukončená</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-[#1A0F0A]">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                      <span style={{ color: '#8B6550' }}>z {f.goal_amount.toLocaleString('cs-CZ')} Kč · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: isShelter ? '#E8634A' : '#2E9E8F' }} />
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
              {articles.map((a: any) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-1 transition-all h-full flex flex-col">
                    <div className="h-40 relative overflow-hidden" style={{ background: '#FAECE7' }}>
                      {a.cover_url
                        ? <Image src={a.cover_url} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
                      }
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="font-bold text-[#1A0F0A] mb-2 leading-tight">{a.title}</div>
                      {a.perex && (
                        <p className="text-xs line-clamp-3 flex-1" style={{ color: '#8B6550' }}>{a.perex}</p>
                      )}
                      <div className="mt-3 text-xs font-bold" style={{ color: '#E8634A' }}>Přečíst →</div>
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
            <p className="text-base leading-relaxed text-[#4A2C1A]" style={{ lineHeight: 1.8 }}>
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
            <h2 className="font-bold text-xl text-[#1A0F0A] mb-5">Kontaktní údaje</h2>

            {[
              { icon: '📍', label: 'Adresa',    value: [i.street, i.city, i.postal_code].filter(Boolean).join(', ') },
              { icon: '✉️', label: 'E-mail',    value: i.email,   href: `mailto:${i.email}` },
              { icon: '📞', label: 'Telefon',   value: i.phone,   href: `tel:${i.phone}` },
              { icon: '🌐', label: 'Web',       value: i.website?.replace(/^https?:\/\//, ''), href: i.website },
            ].filter(c => c.value).map(({ icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#F0EDE8]">
                <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>{label}</div>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined}
                      className="text-sm font-medium no-underline hover:opacity-70 transition-opacity"
                      style={{ color: isShelter ? '#E8634A' : '#2E9E8F' }}>
                      {value}
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-[#1A0F0A]">{value}</div>
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
                style={{ background: isShelter ? '#E8634A' : '#2E9E8F' }}
              >
                🗺️ Navigovat v Google Maps
              </a>
            )}

            {/* Newsletter odběr */}
            <div className="pt-2">
              <NewsletterSubscribe
                institutionId={i.id}
                institutionName={i.name}
                isShelter={isShelter}
              />
            </div>
          </div>

          {/* Mapa */}
          {i.lat && i.lng ? (
            <div>
              <h2 className="font-bold text-xl text-[#1A0F0A] mb-5">Kde nás najdete</h2>
              <div className="rounded-2xl overflow-hidden border border-[#F0EDE8] shadow-sm">
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
              <p className="text-sm text-center" style={{ color: '#8B6550' }}>
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
      <p className="text-sm" style={{ color: '#8B6550' }}>{text}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    available: { label: 'K adopci',    bg: '#EAF3DE', color: '#3B6D11' },
    reserved:  { label: 'Rezervováno', bg: '#FAEEDA', color: '#854F0B' },
    foster:    { label: 'Ve foster',   bg: '#E1F5EE', color: '#0F6E56' },
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
    intake:         { label: 'Příjem',        bg: '#FAECE7', color: '#993C1D' },
    treatment:      { label: 'Léčba',         bg: '#FAEEDA', color: '#854F0B' },
    rehabilitation: { label: 'Rehabilitace',  bg: '#E1F5EE', color: '#0F6E56' },
    released:       { label: 'Propuštěn',     bg: '#EAF3DE', color: '#3B6D11' },
    transferred:    { label: 'Přemístěn',     bg: '#F0EDE8', color: '#5F5E5A' },
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
