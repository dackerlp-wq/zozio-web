import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { PhotoGallery } from '@/components/public/PhotoGallery'
import { ShareButtons } from '@/components/public/ShareButtons'
import { DonationWidget } from '@/components/public/DonationWidget'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const c = await getRescueCase(id)
  if (!c) return { title: 'Případ nenalezen | Zozio' }
  const r = c as any
  return {
    title:       `${r.name ?? r.case_number} | Záchranná stanice | Zozio`,
    description: r.public_description?.slice(0, 155) ?? '',
    openGraph:   { images: r.primary_photo ? [{ url: r.primary_photo }] : [] },
  }
}

const RESCUE_STEPS = [
  { key: 'intake',         label: 'Příjem',         icon: '🚑', desc: 'Zvíře bylo přijato do záchranné stanice.' },
  { key: 'treatment',      label: 'Léčba',          icon: '🩺', desc: 'Probíhá veterinární léčba a ošetření.' },
  { key: 'rehabilitation', label: 'Rehabilitace',   icon: '💪', desc: 'Zvíře se zotavuje a trénuje před propuštěním.' },
  { key: 'released',       label: 'Propuštěno',     icon: '🌿', desc: 'Zvíře bylo úspěšně vráceno do přírody.' },
]

const STEP_ORDER: Record<string, number> = {
  intake: 0, treatment: 1, rehabilitation: 2, released: 3, transferred: 3, deceased: 3,
}

export default async function RescueCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const rescueCase = await getRescueCase(id)
  if (!rescueCase) notFound()

  const r           = rescueCase as any
  const institution = r.institution as any
  const species     = r.species     as any
  const [fundraiser, similar] = await Promise.all([
    getFundraiser(id),
    getSimilarCases(id, r.institution_id),
  ])

  const currentStep = STEP_ORDER[r.status] ?? 0
  const isReleased  = r.status === 'released'
  const isDeceased  = r.status === 'deceased'
  const shareUrl    = `${BASE}/rescue/${id}`

  const intakeDate = r.intake_date
    ? new Date(r.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const releaseDate = r.release_date
    ? new Date(r.release_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 py-5 text-sm" style={{ color: '#8B6550' }}>
          <Link href="/" className="no-underline hover:opacity-70" style={{ color: '#8B6550' }}>Domů</Link>
          <span>·</span>
          <Link href="/rescue" className="no-underline hover:opacity-70" style={{ color: '#8B6550' }}>Záchranné stanice</Link>
          <span>·</span>
          <span className="font-semibold" style={{ color: '#1A0F0A' }}>{r.name ?? r.case_number}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start">

          {/* ── Levý sloupec ── */}
          <div>

            {/* Galerie */}
            <div className="mb-8">
              <PhotoGallery
                photos={r.photos ?? []}
                primaryPhoto={r.primary_photo}
                animalName={r.name ?? r.case_number ?? 'Záchranný případ'}
                icon={species?.icon}
              />
              <div className="mt-4">
                <ShareButtons
                  url={shareUrl}
                  title={`${r.name ?? r.case_number} potřebuje pomoc`}
                  text={r.public_description?.slice(0, 100) ?? ''}
                />
              </div>
            </div>

            {/* Název + meta — mobilní */}
            <div className="lg:hidden mb-8">
              <RescueHeader r={r} species={species} institution={institution} intakeDate={intakeDate} />
            </div>

            {/* Co se stalo */}
            {r.public_description && (
              <section className="mb-8">
                <SectionTitle>Co se stalo</SectionTitle>
                <p className="text-base leading-relaxed" style={{ color: '#4A2C1A', lineHeight: 1.8 }}>
                  {r.public_description}
                </p>
              </section>
            )}

            {/* Příčina + diagnóza */}
            {(r.cause_of_injury || r.diagnosis) && (
              <section className="mb-8">
                <SectionTitle>Zdravotní stav</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {r.cause_of_injury && (
                    <InfoCard icon="⚡" label="Příčina" value={r.cause_of_injury} />
                  )}
                  {r.diagnosis && (
                    <InfoCard icon="🔬" label="Diagnóza" value={r.diagnosis} />
                  )}
                  {r.estimated_age && (
                    <InfoCard icon="📅" label="Odhadovaný věk" value={r.estimated_age} />
                  )}
                  {r.weight_g && (
                    <InfoCard icon="⚖️" label="Váha při příjmu" value={`${r.weight_g} g`} />
                  )}
                </div>
              </section>
            )}

            {/* ── TIMELINE ── */}
            <section className="mb-8">
              <SectionTitle>Průběh léčby</SectionTitle>

              {isDeceased ? (
                <div className="p-5 rounded-lg text-center"
                  style={{ background: '#F0EDE8', border: '1px solid #E0DDD8' }}>
                  <div className="text-3xl mb-2">💔</div>
                  <p className="font-bold text-[#1A0F0A]">Toto zvíře bohužel nepřežilo.</p>
                  {r.treatment_notes && (
                    <p className="text-sm mt-2" style={{ color: '#8B6550' }}>{r.treatment_notes}</p>
                  )}
                </div>
              ) : r.status === 'transferred' ? (
                <div className="p-5 rounded-lg"
                  style={{ background: '#F0EDE8', border: '1px solid #E0DDD8' }}>
                  <div className="font-bold text-[#1A0F0A] mb-1">🚐 Přemístěno jinam</div>
                  {r.treatment_notes && (
                    <p className="text-sm" style={{ color: '#8B6550' }}>{r.treatment_notes}</p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Spojovací linka */}
                  <div className="absolute left-[23px] top-8 bottom-8 w-0.5"
                    style={{ background: '#F0EDE8' }} />

                  <div className="space-y-0">
                    {RESCUE_STEPS.map((step, idx) => {
                      const isDone    = idx < currentStep
                      const isActive  = idx === currentStep
                      const isFuture  = idx > currentStep

                      return (
                        <div key={step.key} className="flex items-start gap-4 relative pb-6 last:pb-0">
                          {/* Dot */}
                          <div className="flex-shrink-0 w-12 flex justify-center pt-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all"
                              style={isActive
                                ? { background: '#2E9E8F', borderColor: '#2E9E8F', boxShadow: '0 0 0 4px rgba(46,158,143,0.15)' }
                                : isDone
                                ? { background: '#EAF3DE', borderColor: '#BDE8D0' }
                                : { background: 'white', borderColor: '#E0DDD8' }
                              }>
                              <span style={{ opacity: isFuture ? 0.35 : 1 }}>{step.icon}</span>
                            </div>
                          </div>

                          {/* Obsah */}
                          <div className={`flex-1 min-w-0 pt-1 ${isFuture ? 'opacity-40' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-base text-[#1A0F0A]">{step.label}</span>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E9E8F] animate-pulse" />
                                  Aktuální stav
                                </span>
                              )}
                              {isDone && (
                                <span className="text-[#3B6D11] text-sm">✓</span>
                              )}
                            </div>
                            <p className="text-sm" style={{ color: '#8B6550' }}>
                              {isActive && r.treatment_notes ? r.treatment_notes : step.desc}
                            </p>
                            {/* Datum */}
                            {step.key === 'intake' && intakeDate && (
                              <p className="text-xs mt-1 font-medium" style={{ color: '#8B6550' }}>
                                📅 {intakeDate}
                              </p>
                            )}
                            {step.key === 'released' && isReleased && releaseDate && (
                              <p className="text-xs mt-1 font-medium" style={{ color: '#3B6D11' }}>
                                📅 {releaseDate}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Propuštění — úspěšný konec */}
            {isReleased && (
              <section className="mb-8">
                <div className="p-6 rounded-lg text-center"
                  style={{ background: 'linear-gradient(135deg, #EAF3DE, #E1F5EE)', border: '1px solid #BDE8D0' }}>
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="font-display font-extrabold text-xl text-[#1A0F0A] mb-2">
                    {r.name ?? 'Toto zvíře'} se vrátilo domů!
                  </h3>
                  {releaseDate && (
                    <p className="text-sm" style={{ color: '#3B6D11' }}>
                      Propuštěno {releaseDate}
                      {r.release_location && ` · ${r.release_location}`}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Podobné případy */}
            {similar.length > 0 && (
              <section className="mb-8">
                <SectionTitle>Další záchranné případy</SectionTitle>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {similar.map((s: any) => (
                    <Link key={s.id} href={`/rescue/${s.id}`} className="no-underline group flex-shrink-0">
                      <div className="w-36 bg-white rounded-lg overflow-hidden border border-[#F0EDE8] hover:border-[#2E9E8F]/40 transition-all">
                        <div className="relative h-28 flex items-center justify-center overflow-hidden"
                          style={{ background: '#E1F5EE' }}>
                          {s.primary_photo
                            ? <Image src={s.primary_photo} alt={s.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <span className="text-3xl">{(s.species as any)?.icon ?? '🐾'}</span>
                          }
                        </div>
                        <div className="p-2.5">
                          <div className="font-bold text-sm text-[#1A0F0A] truncate">{s.name ?? s.case_number}</div>
                          <div className="text-xs truncate mt-0.5" style={{ color: '#8B6550' }}>
                            {(s.species as any)?.name_cs}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Donační widget — mobilní */}
            {fundraiser && !isDeceased && (
              <div className="lg:hidden">
                <DonationWidget fundraiser={fundraiser} variant="rescue" />
              </div>
            )}
          </div>

          {/* ── Pravý sloupec — sticky ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">

              {/* Info karta */}
              <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
                {/* Název + meta */}
                <div className="p-5 border-b border-[#F0EDE8]">
                  <RescaseHeader r={r} species={species} />
                </div>

                {/* Instituce */}
                {institution && (
                  <div className="px-5 py-4 border-b border-[#F0EDE8] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>
                        Záchranná stanice
                      </div>
                      <div className="font-semibold text-sm text-[#1A0F0A]">{institution.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {institution.city}</div>
                    </div>
                    <Link href={`/institutions/${institution.slug}`}
                      className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                      Profil →
                    </Link>
                  </div>
                )}

                {/* Rychlé info */}
                <div className="px-5 py-4 space-y-2">
                  {intakeDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: '#8B6550' }}>📅 Příjem:</span>
                      <span className="font-medium text-[#1A0F0A]">{intakeDate}</span>
                    </div>
                  )}
                  {r.found_location && (
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: '#8B6550' }}>📍 Naleziště:</span>
                      <span className="font-medium text-[#1A0F0A] truncate">{r.found_location}</span>
                    </div>
                  )}
                  {r.found_by && (
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: '#8B6550' }}>👤 Nalezl/a:</span>
                      <span className="font-medium text-[#1A0F0A]">{r.found_by}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Donační widget */}
              {fundraiser && !isDeceased && (
                <DonationWidget fundraiser={fundraiser} variant="rescue" />
              )}

              {/* CTA bez sbírky */}
              {!fundraiser && !isReleased && !isDeceased && (
                <div className="bg-white rounded-lg border border-[#F0EDE8] p-5 text-center">
                  <div className="text-3xl mb-2">💛</div>
                  <p className="text-sm font-semibold text-[#1A0F0A] mb-1">Chceš pomoci?</p>
                  <p className="text-xs mb-4" style={{ color: '#8B6550' }}>
                    Kontaktuj záchrannou stanici přímo.
                  </p>
                  {institution?.email && (
                    <a href={`mailto:${institution.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-white no-underline hover:opacity-90"
                      style={{ background: '#2E9E8F' }}>
                      ✉️ Napsat stanici
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Helper komponenty ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold text-lg text-[#1A0F0A] mb-4 pb-3 border-b border-[#F0EDE8]">
      {children}
    </h2>
  )
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-[#F0EDE8]">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#8B6550' }}>{label}</div>
        <div className="text-sm font-medium text-[#1A0F0A]">{value}</div>
      </div>
    </div>
  )
}

function RescueHeader({ r, species, institution, intakeDate }: any) {
  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    intake:         { label: '🚑 Příjem',       bg: '#FAECE7', color: '#993C1D' },
    treatment:      { label: '🩺 Léčba',        bg: '#FAEEDA', color: '#854F0B' },
    rehabilitation: { label: '💪 Rehabilitace', bg: '#E1F5EE', color: '#0F6E56' },
    released:       { label: '🌿 Propuštěno',  bg: '#EAF3DE', color: '#3B6D11' },
    transferred:    { label: '🚐 Přemístěno',  bg: '#F0EDE8', color: '#5F5E5A' },
    deceased:       { label: '💔 Uhynulo',      bg: '#F0EDE8', color: '#5F5E5A' },
  }
  const status = statusConfig[r.status] ?? statusConfig.intake

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="font-display font-extrabold text-[#1A0F0A] leading-tight"
          style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
          {r.name ?? r.case_number}
        </h1>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 mt-1"
          style={{ background: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>
      <p className="text-sm" style={{ color: '#8B6550' }}>
        {[species?.name_cs, r.estimated_age, r.sex === 'male' ? '♂ Samec' : r.sex === 'female' ? '♀ Samice' : null]
          .filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}

// Desktop panel verze (kompaktnější)
function RescaseHeader({ r, species }: any) {
  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    intake:         { label: '🚑 Příjem',       bg: '#FAECE7', color: '#993C1D' },
    treatment:      { label: '🩺 Léčba',        bg: '#FAEEDA', color: '#854F0B' },
    rehabilitation: { label: '💪 Rehabilitace', bg: '#E1F5EE', color: '#0F6E56' },
    released:       { label: '🌿 Propuštěno',  bg: '#EAF3DE', color: '#3B6D11' },
    transferred:    { label: '🚐 Přemístěno',  bg: '#F0EDE8', color: '#5F5E5A' },
    deceased:       { label: '💔 Uhynulo',      bg: '#F0EDE8', color: '#5F5E5A' },
  }
  const status = statusConfig[r.status] ?? statusConfig.intake

  return (
    <div>
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold mb-2"
        style={{ background: status.bg, color: status.color }}>
        {status.label}
      </span>
      <div className="font-bold text-lg text-[#1A0F0A] mb-1">{r.name ?? r.case_number}</div>
      <div className="text-xs" style={{ color: '#8B6550' }}>
        {[species?.name_cs, r.estimated_age].filter(Boolean).join(' · ')}
      </div>
    </div>
  )
}

/* ── Data ── */

async function getRescueCase(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('*, institution:institutions(id,name,city,type,slug,email,phone), species:animal_species(id,name_cs,icon)')
    .eq('id', id)
    .eq('published', true)
    .single()
  return data
}

async function getFundraiser(rescueCaseId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('*')
    .eq('rescue_case_id', rescueCaseId)
    .eq('active', true)
    .single()
  return data ?? null
}

async function getSimilarCases(id: string, institutionId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, primary_photo, status, species:animal_species(name_cs,icon)')
    .eq('institution_id', institutionId)
    .eq('published', true)
    .not('status', 'in', '("deceased")')
    .neq('id', id)
    .limit(5)
  return data ?? []
}
