import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { PhotoGallery } from '@/components/public/PhotoGallery'
import { ShareButtons } from '@/components/public/ShareButtons'
import { DonationWidget } from '@/components/public/DonationWidget'
import type { RescueCase, Institution, AnimalSpecies, Fundraiser } from '@/types/database'

/* ── Query-specific types ── */
interface RescueCaseDetail extends Omit<RescueCase, 'institution' | 'species'> {
  institution: Pick<Institution, 'id' | 'name' | 'city' | 'type' | 'slug' | 'email' | 'phone'> | null
  species: Pick<AnimalSpecies, 'id' | 'name_cs' | 'icon'> | null
  weight_g?: number | null
  release_location?: string | null
}

interface SimilarCase {
  id: string
  name: string | null
  case_number: string | null
  primary_photo: string | null
  status: string
  species: { name_cs: string; icon: string | null } | null
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const r = await getRescueCase(id)
  if (!r) return { title: 'Případ nenalezen | Zozio' }
  return {
    title:       `${r.name ?? r.case_number} | Záchranná stanice | Zozio`,
    description: r.public_description?.slice(0, 155) ?? '',
    openGraph:   { images: r.primary_photo ? [{ url: r.primary_photo }] : [] },
  }
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  intake:         { label: '🚑 Příjem',       bg: '#FAECE7', color: '#993C1D' },
  treatment:      { label: '🩺 Léčba',        bg: '#FAEEDA', color: '#854F0B' },
  rehabilitation: { label: '💪 Rehabilitace', bg: '#E1F5EE', color: '#0F6E56' },
  released:       { label: '🌿 Propuštěno',  bg: '#EAF3DE', color: '#3B6D11' },
  transferred:    { label: '🚐 Přemístěno',  bg: '#F0EDE8', color: '#5F5E5A' },
  deceased:       { label: '💔 Uhynulo',      bg: '#F0EDE8', color: '#5F5E5A' },
}

const RESCUE_STEPS = [
  { key: 'intake',         label: 'Příjem',       icon: '🚑', desc: 'Zvíře bylo přijato do záchranné stanice.' },
  { key: 'treatment',      label: 'Léčba',        icon: '🩺', desc: 'Probíhá veterinární léčba a ošetření.' },
  { key: 'rehabilitation', label: 'Rehabilitace', icon: '💪', desc: 'Zvíře se zotavuje a trénuje před propuštěním.' },
  { key: 'released',       label: 'Propuštěno',   icon: '🌿', desc: 'Zvíře bylo úspěšně vráceno do přírody.' },
]

const STEP_ORDER: Record<string, number> = {
  intake: 0, treatment: 1, rehabilitation: 2, released: 3, transferred: 3, deceased: 3,
}

export default async function RescueCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const r = await getRescueCase(id)
  if (!r) notFound()

  const institution = r.institution
  const species     = r.species
  const fundraiser  = await getFundraiser(id)
  const similar     = await getSimilarCases(id, r.institution_id)

  const currentStep = STEP_ORDER[r.status] ?? 0
  const isReleased  = r.status === 'released'
  const isDeceased  = r.status === 'deceased'
  const shareUrl    = `${BASE}/rescue/${id}`
  const caseName    = r.name ?? r.case_number ?? 'Záchranný případ'
  const status      = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.intake

  const intakeDate = r.intake_date
    ? new Date(r.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const releaseDate = r.release_date
    ? new Date(r.release_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 py-5 text-sm text-text-muted">
          <Link href="/" className="no-underline hover:opacity-70 text-text-muted">Domů</Link>
          <span>·</span>
          <Link href="/rescue" className="no-underline hover:opacity-70 text-text-muted">Záchranné stanice</Link>
          <span>·</span>
          <span className="font-semibold text-text-primary">{r.name ?? r.case_number}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

          {/* ── Levý sloupec ── */}
          <div>

            {/* Galerie + share */}
            <div className="mb-6">
              <PhotoGallery
                photos={r.photos ?? []}
                primaryPhoto={r.primary_photo}
                animalName={caseName}
                icon={species?.icon}
              />
              <div className="mt-3">
                <ShareButtons
                  url={shareUrl}
                  title={`${caseName} potřebuje pomoc`}
                  text={r.public_description?.slice(0, 100) ?? ''}
                />
              </div>
            </div>

            {/* Název + status + instituce — mobilní */}
            <div className="lg:hidden mb-6">
              <CaseNameBlock r={r} species={species} status={status} caseName={caseName} />
              {institution && (
                <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-lg border border-[#F0EDE8] bg-white">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#8B6550' }}>
                      Záchranná stanice
                    </div>
                    <div className="font-semibold text-sm text-[#1A0F0A]">{institution.name}</div>
                    {institution.city && <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {institution.city}</div>}
                  </div>
                  <Link href={`/institutions/${institution.slug}`}
                    className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 flex-shrink-0"
                    style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                    Profil →
                  </Link>
                </div>
              )}
            </div>

            {/* Co se stalo */}
            {r.public_description && (
              <section className="mb-7">
                <SectionTitle>Co se stalo</SectionTitle>
                <p className="text-base leading-relaxed" style={{ color: '#4A2C1A', lineHeight: 1.85 }}>
                  {r.public_description}
                </p>
              </section>
            )}

            {/* Info box */}
            <RescueInfoBox r={r} species={species} intakeDate={intakeDate} releaseDate={releaseDate} />

            {/* Průběh léčby — timeline */}
            <section className="mb-7">
              <SectionTitle>Průběh léčby</SectionTitle>

              {isDeceased ? (
                <div className="p-5 rounded-2xl text-center"
                  style={{ background: 'var(--border)', border: '1px solid #E0DDD8' }}>
                  <div className="text-3xl mb-2">💔</div>
                  <p className="font-bold text-text-primary">Toto zvíře bohužel nepřežilo.</p>
                  {r.treatment_notes && (
                    <p className="text-sm mt-2 text-text-muted">{r.treatment_notes}</p>
                  )}
                </div>
              ) : r.status === 'transferred' ? (
                <div className="p-5 rounded-2xl"
                  style={{ background: 'var(--border)', border: '1px solid #E0DDD8' }}>
                  <div className="font-bold text-text-primary mb-1">🚐 Přemístěno jinam</div>
                  {r.treatment_notes && (
                    <p className="text-sm text-text-muted">{r.treatment_notes}</p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Spojovací linka */}
                  <div className="absolute left-[23px] top-8 bottom-8 w-0.5"
                    style={{ background: 'var(--border)' }} />

                  <div className="space-y-0">
                    {RESCUE_STEPS.map((step, idx) => {
                      const isDone   = idx < currentStep
                      const isActive = idx === currentStep
                      const isFuture = idx > currentStep
                      return (
                        <div key={step.key} className="flex items-start gap-4 relative pb-6 last:pb-0">
                          <div className="flex-shrink-0 w-12 flex justify-center pt-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all"
                              style={isActive
                                ? { background: 'var(--rescue)', borderColor: 'var(--rescue)', boxShadow: '0 0 0 4px rgba(46,158,143,0.15)' }
                                : isDone
                                ? { background: 'var(--success-tag-bg)', borderColor: '#BDE8D0' }
                                : { background: 'white', borderColor: '#E0DDD8' }
                              }>
                              <span style={{ opacity: isFuture ? 0.35 : 1 }}>{step.icon}</span>
                            </div>
                          </div>
                          <div className={`flex-1 min-w-0 pt-1 ${isFuture ? 'opacity-40' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-base text-text-primary">{step.label}</span>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{ background: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rescue animate-pulse" />
                                  Aktuální stav
                                </span>
                              )}
                              {isDone && (
                                <span className="text-success-tag-text text-sm">✓</span>
                              )}
                            </div>
                            <p className="text-sm text-text-muted">
                              {isActive && r.treatment_notes ? r.treatment_notes : step.desc}
                            </p>
                            {step.key === 'intake' && intakeDate && (
                              <p className="text-xs mt-1 font-medium text-text-muted">
                                📅 {intakeDate}
                              </p>
                            )}
                            {step.key === 'released' && isReleased && releaseDate && (
                              <p className="text-xs mt-1 font-medium text-success-tag-text">
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

            {/* Úspěšné propuštění */}
            {isReleased && (
              <section className="mb-8">
                <div className="p-6 rounded-2xl text-center"
                  style={{ background: 'linear-gradient(135deg, var(--success-tag-bg), var(--rescue-tag-bg))', border: '1px solid #BDE8D0' }}>
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="font-display font-extrabold text-xl text-text-primary mb-2">
                    {r.name ?? 'Toto zvíře'} se vrátilo domů!
                  </h3>
                  {releaseDate && (
                    <p className="text-sm text-success-tag-text">
                      Propuštěno {releaseDate}
                      {r.release_location && ` · ${r.release_location}`}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Donační widget — mobilní */}
            {fundraiser && !isDeceased && (
              <div className="lg:hidden mb-7">
                <DonationWidget fundraiser={fundraiser} variant="rescue" />
              </div>
            )}

            {/* CTA bez sbírky — mobilní */}
            {!fundraiser && !isReleased && !isDeceased && institution?.email && (
              <div className="lg:hidden mb-7 bg-white rounded-lg border border-[#F0EDE8] p-5 text-center">
                <div className="text-3xl mb-2">💛</div>
                <p className="text-sm font-semibold text-[#1A0F0A] mb-1">Chceš pomoci?</p>
                <p className="text-xs mb-4" style={{ color: '#8B6550' }}>Kontaktuj záchrannou stanici přímo.</p>
                <a href={`mailto:${institution.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-white no-underline hover:opacity-90"
                  style={{ background: '#2E9E8F' }}>
                  ✉️ Napsat stanici
                </a>
              </div>
            )}

            {/* Podobné případy */}
            {similar.length > 0 && (
              <section className="mb-7">
                <SectionTitle>Další záchranné případy</SectionTitle>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {similar.map((s: SimilarCase) => (
                    <Link key={s.id} href={`/rescue/${s.id}`} className="no-underline group flex-shrink-0">
                      <div className="w-36 bg-white rounded-xl overflow-hidden border border-border hover:border-rescue/40 transition-all">
                        <div className="relative h-28 flex items-center justify-center overflow-hidden"
                          style={{ background: 'var(--rescue-tag-bg)' }}>
                          {s.primary_photo
                            ? <Image src={s.primary_photo} alt={s.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <span className="text-3xl">{s.species?.icon ?? '🐾'}</span>
                          }
                        </div>
                        <div className="p-2.5">
                          <div className="font-bold text-sm text-text-primary truncate">{s.name ?? s.case_number}</div>
                          <div className="text-xs truncate mt-0.5 text-text-muted">
                            {s.species?.name_cs}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Pravý sloupec — sticky ── */}
          <div className="hidden lg:block">
            <StickyPanel>

              {/* Info karta */}
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Název + meta */}
                <div className="p-5 border-b border-border">
                  <RescaseHeader r={r} species={species} />
                </div>
              )}

                {/* Instituce */}
                {institution && (
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-text-muted">
                        Záchranná stanice
                      </div>
                      <div className="font-semibold text-sm text-text-primary">{institution.name}</div>
                      <div className="text-xs mt-0.5 text-text-muted">📍 {institution.city}</div>
                    </div>
                    <Link href={`/institutions/${institution.slug}`}
                      className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: '#E0DDD8', color: 'var(--text-body)' }}>
                      Profil →
                    </Link>
                  </div>
                )}

                {/* Rychlé info */}
                <div className="px-5 py-4 space-y-2">
                  {intakeDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-muted">📅 Příjem:</span>
                      <span className="font-medium text-text-primary">{intakeDate}</span>
                    </div>
                  )}
                  {r.found_location && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-muted">📍 Naleziště:</span>
                      <span className="font-medium text-text-primary truncate">{r.found_location}</span>
                    </div>
                  )}
                  {r.found_by && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-muted">👤 Nalezl/a:</span>
                      <span className="font-medium text-text-primary">{r.found_by}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Propuštění — success */}
              {isReleased && (
                <div className="p-5 border-b border-[#F0EDE8]">
                  <div className="rounded-lg p-4 text-center"
                    style={{ background: 'linear-gradient(135deg, #EAF3DE, #E1F5EE)', border: '1px solid #BDE8D0' }}>
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="font-bold text-sm text-[#1A0F0A] mb-1">Úspěšně propuštěno!</p>
                    {releaseDate && (
                      <p className="text-xs" style={{ color: '#3B6D11' }}>
                        {releaseDate}{r.release_location && ` · ${r.release_location}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Donační widget */}
              {fundraiser && !isDeceased && (
                <DonationWidget fundraiser={fundraiser} variant="rescue" />
              )}

              {/* CTA bez sbírky */}
              {!fundraiser && !isReleased && !isDeceased && (
                <div className="bg-white rounded-2xl border border-border p-5 text-center">
                  <div className="text-3xl mb-2">💛</div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Chceš pomoci?</p>
                  <p className="text-xs mb-4 text-text-muted">
                    Kontaktuj záchrannou stanici přímo.
                  </p>
                  {institution?.email && (
                    <a href={`mailto:${institution.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white no-underline hover:opacity-90 bg-rescue">
                      ✉️ Napsat stanici
                    </a>
                  )}
                </div>
              )}

              {/* CTA — přispět bez sbírky */}
              {!fundraiser && !isReleased && !isDeceased && (
                <div className="p-5">
                  <div className="rounded-lg p-4 text-center" style={{ background: '#F0FBF9', border: '1px solid #C8EBE7' }}>
                    <div className="text-2xl mb-2">💛</div>
                    <p className="text-sm font-bold text-[#1A0F0A] mb-1">Chceš pomoci?</p>
                    <p className="text-xs mb-3" style={{ color: '#8B6550' }}>
                      Záchranné stanice fungují na dobrovolnické bázi. Každá pomoc se počítá.
                    </p>
                    <div className="flex flex-col gap-2">
                      {institution?.email && (
                        <a href={`mailto:${institution.email}`}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-white no-underline hover:opacity-90"
                          style={{ background: '#2E9E8F' }}>
                          ✉️ Napsat stanici
                        </a>
                      )}
                      {institution?.slug && (
                        <Link href={`/institutions/${institution.slug}`}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm no-underline hover:opacity-80 border"
                          style={{ borderColor: '#C8EBE7', color: '#0F6E56' }}>
                          Zobrazit profil stanice →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deceased */}
              {isDeceased && (
                <div className="p-5">
                  <div className="rounded-lg p-4 text-center" style={{ background: '#F5F3F0', border: '1px solid #E0DDD8' }}>
                    <div className="text-2xl mb-2">💔</div>
                    <p className="text-sm font-bold text-[#1A0F0A] mb-1">Toto zvíře bohužel nepřežilo</p>
                    <p className="text-xs mb-3" style={{ color: '#8B6550' }}>
                      Záchranáři udělali vše, co bylo v jejich silách.
                    </p>
                    {institution?.slug && (
                      <Link href={`/institutions/${institution.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold no-underline hover:opacity-80"
                        style={{ color: '#6B4030' }}>
                        Podpořit záchrannou stanici →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </StickyPanel>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Komponenty ── */

function MiniStepper({ currentStep, isReleased }: { currentStep: number; isReleased: boolean }) {
  const steps = [
    { icon: '🚑', label: 'Příjem' },
    { icon: '🩺', label: 'Léčba' },
    { icon: '💪', label: 'Rehab' },
    { icon: '🌿', label: 'Propuštění' },
  ]
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#8B6550' }}>
        Stav léčby
      </p>
      <div className="flex items-center">
        {steps.map((s, i) => {
          const isDone   = i < currentStep || isReleased
          const isActive = i === currentStep && !isReleased
          const isFuture = i > currentStep && !isReleased
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all"
                  style={isActive
                    ? { background: '#2E9E8F', borderColor: '#2E9E8F', boxShadow: '0 0 0 3px rgba(46,158,143,0.2)' }
                    : isDone
                    ? { background: '#EAF3DE', borderColor: '#BDE8D0' }
                    : { background: 'white', borderColor: '#E8E4DF' }
                  }>
                  <span style={{ opacity: isFuture ? 0.3 : 1, fontSize: '14px' }}>{s.icon}</span>
                </div>
                <span className="text-[10px] font-medium text-center leading-tight"
                  style={{ color: isActive ? '#0F6E56' : isDone ? '#3B6D11' : '#B0A090' }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 mb-4"
                  style={{ background: isDone ? '#BDE8D0' : '#EDE8E3' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SidebarQuickInfo({ r, intakeDate, releaseDate }: any) {
  const rows = [
    intakeDate       && { icon: '📅', label: 'Příjem',         value: intakeDate },
    r.found_location && { icon: '📍', label: 'Místo nálezu',   value: r.found_location },
    r.cause_of_injury && { icon: '⚡', label: 'Příčina',        value: r.cause_of_injury },
    r.weight_g       && { icon: '⚖️', label: 'Váha',           value: `${r.weight_g} g` },
    releaseDate      && { icon: '🌿', label: 'Propuštění',      value: releaseDate },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  if (!rows.length) return null

  return (
    <div className="border-b border-[#F0EDE8]">
      {rows.map((row, i) => (
        <div key={row.label}
          className={`flex items-center gap-2.5 px-5 py-2.5 ${i > 0 ? 'border-t border-[#F8F5F2]' : ''}`}>
          <span className="text-sm w-5 text-center flex-shrink-0">{row.icon}</span>
          <span className="text-xs flex-1" style={{ color: '#8B6550' }}>{row.label}</span>
          <span className="text-xs font-semibold text-[#1A0F0A] text-right truncate max-w-[130px]">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold text-lg text-text-primary mb-4 pb-3 border-b border-border">
      {children}
    </h2>
  )
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-border">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5 text-text-muted">{label}</div>
        <div className="text-sm font-medium text-text-primary">{value}</div>
      </div>
    </div>
  )
}

function RescueHeader({ r, species, institution, intakeDate }: {
  r: RescueCaseDetail
  species: Pick<AnimalSpecies, 'id' | 'name_cs' | 'icon'> | null
  institution: Pick<Institution, 'id' | 'name' | 'city' | 'type' | 'slug' | 'email' | 'phone'> | null
  intakeDate: string | null
}) {
  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    intake:         { label: '🚑 Příjem',       bg: 'var(--coral-tag-bg)', color: 'var(--coral-tag-text)' },
    treatment:      { label: '🩺 Léčba',        bg: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' },
    rehabilitation: { label: '💪 Rehabilitace', bg: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' },
    released:       { label: '🌿 Propuštěno',  bg: 'var(--success-tag-bg)', color: 'var(--success-tag-text)' },
    transferred:    { label: '🚐 Přemístěno',  bg: 'var(--border)', color: 'var(--text-neutral)' },
    deceased:       { label: '💔 Uhynulo',      bg: 'var(--border)', color: 'var(--text-neutral)' },
  }
  const status = statusConfig[r.status] ?? statusConfig.intake

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="font-display font-extrabold text-text-primary leading-tight"
          style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
          {caseName}
        </h1>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 mt-1"
          style={{ background: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>
      <p className="text-sm text-text-muted">
        {[species?.name_cs, r.estimated_age, r.sex === 'male' ? '♂ Samec' : r.sex === 'female' ? '♀ Samice' : null]
          .filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}

// Desktop panel verze (kompaktnější)
function RescaseHeader({ r, species }: {
  r: RescueCaseDetail
  species: Pick<AnimalSpecies, 'id' | 'name_cs' | 'icon'> | null
}) {
  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    intake:         { label: '🚑 Příjem',       bg: 'var(--coral-tag-bg)', color: 'var(--coral-tag-text)' },
    treatment:      { label: '🩺 Léčba',        bg: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' },
    rehabilitation: { label: '💪 Rehabilitace', bg: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' },
    released:       { label: '🌿 Propuštěno',  bg: 'var(--success-tag-bg)', color: 'var(--success-tag-text)' },
    transferred:    { label: '🚐 Přemístěno',  bg: 'var(--border)', color: 'var(--text-neutral)' },
    deceased:       { label: '💔 Uhynulo',      bg: 'var(--border)', color: 'var(--text-neutral)' },
  }
  const status = statusConfig[r.status] ?? statusConfig.intake

  return (
    <div>
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold mb-2"
        style={{ background: status.bg, color: status.color }}>
        {status.label}
      </span>
      <div className="font-bold text-lg text-text-primary mb-1">{r.name ?? r.case_number}</div>
      <div className="text-xs text-text-muted">
        {[species?.name_cs, r.estimated_age].filter(Boolean).join(' · ')}
      </div>
    </section>
  )
}

function SimilarCaseCard({ c }: { c: any }) {
  const species = c.species as any
  const status  = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.intake

  return (
    <Link href={`/rescue/${c.id}`} className="no-underline group">
      <div className="bg-white rounded-lg overflow-hidden border border-[#F0EDE8] hover:border-[#2E9E8F]/40 hover:-translate-y-0.5 transition-all">
        <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
          style={{ background: '#E1F5EE' }}>
          {c.primary_photo
            ? <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <span className="text-4xl">{species?.icon ?? '🐾'}</span>
          }
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: status.bg, color: status.color }}>
            {status.label}
          </div>
        </div>
        <div className="p-3">
          <div className="font-bold text-sm text-[#1A0F0A] truncate group-hover:opacity-80 transition-opacity">
            {c.name ?? c.case_number}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: '#8B6550' }}>
            {species?.name_cs}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Data ── */

async function getRescueCase(id: string): Promise<RescueCaseDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('*, institution:institutions(id,name,city,type,slug,email,phone), species:animal_species(id,name_cs,icon)')
    .eq('id', id)
    .eq('published', true)
    .single()
  return data as RescueCaseDetail | null
}

async function getFundraiser(rescueCaseId: string): Promise<Fundraiser | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('*')
    .eq('rescue_case_id', rescueCaseId)
    .eq('active', true)
    .single()
  return (data as Fundraiser | null) ?? null
}

async function getSimilarCases(id: string, institutionId: string): Promise<SimilarCase[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, primary_photo, status, species:animal_species(name_cs,icon)')
    .eq('institution_id', institutionId)
    .eq('published', true)
    .not('status', 'in', '("deceased")')
    .neq('id', id)
    .limit(5)
  return (data ?? []) as unknown as SimilarCase[]
}
